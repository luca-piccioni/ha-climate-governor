"""Coordinator for Climate Governor.

One coordinator per config entry. It owns the per-zone controllers (control
law + schedule + actuator adapters), the sensor aggregation, the outdoor
source chain, the periodic tick and the duty-cycle window scheduling.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from homeassistant.components.climate import HVACAction, HVACMode
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTemperature
from homeassistant.core import Event, HomeAssistant, State, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.event import (
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .actuators import (
    ActuatorAdapter,
    ActuatorCapabilities,
    ClimateCascadeActuator,
    SwitchValveActuator,
    create_actuator,
)
from .const import (
    ACTUATOR_ROLE_COOL,
    ACTUATOR_ROLE_DEHUMIDIFY,
    ACTUATOR_ROLE_HEAT,
    CONF_MASTER_COOL,
    CONF_MASTER_HEAT,
    DEFAULT_TICK_INTERVAL_SECONDS,
    DOMAIN,
    PRESET_BOOST,
    SEASON_COOLING,
    SEASON_HEATING,
    SUBENTRY_TYPE_PERIOD,
    SUBENTRY_TYPE_ZONE,
)
from .control import (
    ControlState,
    duty_window_seconds,
    reset_integral,
    setpoint_offset,
    step,
)
from .models import (
    GovernorConfig,
    GovernorOptions,
    PeriodSpec,
    ZoneSpec,
    apply_season,
    parse_governor_config,
    parse_governor_options,
    parse_period_subentry,
    parse_zone_subentry,
)
from .schedule import Period, resolve
from .sensors import OutdoorSource, ZoneSensors

_LOGGER = logging.getLogger(__name__)

type ClimateGovernorConfigEntry = ConfigEntry[GovernorCoordinator]


@dataclass(slots=True)
class ZoneUserConfig:
    """User-adjustable per-zone state (EntityCategory.CONFIG entities write here)."""

    enabled: bool = True
    boost: bool = False
    setpoint_offset: float = 0.0
    hvac_mode: str = HVACMode.HEAT_COOL.value
    preset: str | None = None  # manual preset hold; None = follow schedule
    tolerance: float | None = None
    kp: float | None = None
    ki: float | None = None


@dataclass(slots=True)
class ZoneState:
    """Published per-zone runtime state for the entity layer."""

    hvac_mode: str = HVACMode.OFF.value
    action: str = HVACAction.IDLE.value
    target_temp: float | None = None
    target_temp_high: float | None = None
    target_temp_low: float | None = None
    current_temp: float | None = None
    humidity: float | None = None
    output_heat: float = 0.0
    output_cool: float = 0.0
    duty_cycle: float = 0.0
    integral: float = 0.0
    schedule_preset: str = ""
    effective_preset: str = ""
    next_change: datetime | None = None
    active: bool = False
    blocked: bool = False
    in_comfort: bool = False
    capabilities: str = ""
    outdoor_temp: float | None = None


@dataclass(slots=True)
class ZoneRuntime:
    """Everything the coordinator keeps per zone."""

    spec: ZoneSpec
    sensors: ZoneSensors
    actuators: list[ActuatorAdapter]
    user: ZoneUserConfig
    control_state: ControlState = field(default_factory=ControlState)
    state: ZoneState = field(default_factory=ZoneState)
    duty_timer: Any = None
    last_step: datetime | None = None
    last_applied: dict[str, tuple[float, float]] = field(default_factory=dict)

    @property
    def switch_actuators(self) -> list[SwitchValveActuator]:
        return [a for a in self.actuators if isinstance(a, SwitchValveActuator)]

    @property
    def climate_actuators(self) -> list[ClimateCascadeActuator]:
        return [a for a in self.actuators if isinstance(a, ClimateCascadeActuator)]

    def capabilities_summary(self) -> str:
        return "; ".join(
            f"{a.entity_id}: {a.capabilities.summary()}" for a in self.actuators
        )


@dataclass(slots=True)
class GovernorState:
    """Published coordinator data."""

    zones: dict[str, ZoneState]
    outdoor_temp: float | None
    updated_at: datetime


class GovernorCoordinator(DataUpdateCoordinator[GovernorState]):
    """Owns zone controllers, timers and sensor aggregation for one entry."""

    config_entry: ClimateGovernorConfigEntry

    def __init__(self, hass: HomeAssistant, entry: ClimateGovernorConfigEntry) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=timedelta(seconds=DEFAULT_TICK_INTERVAL_SECONDS),
        )
        self.config: GovernorConfig = parse_governor_config(dict(entry.data))
        self.options: GovernorOptions = parse_governor_options(dict(entry.options))
        self.zones: dict[str, ZoneRuntime] = {}
        self.periods: list[PeriodSpec] = []
        self.outdoor = OutdoorSource(hass, self.config.outdoor_entity_id)
        self.master_heat: bool = bool(entry.options.get(CONF_MASTER_HEAT, True))
        self.master_cool: bool = bool(entry.options.get(CONF_MASTER_COOL, True))
        self._unsub_trackers: list[Any] = []

    async def async_setup(self) -> None:
        """Build zone runtimes from subentries and start tracking."""
        entry = self.config_entry
        self.periods = [
            parse_period_subentry(sub)
            for sub in entry.get_subentries_of_type(SUBENTRY_TYPE_PERIOD)
        ]
        for sub in entry.get_subentries_of_type(SUBENTRY_TYPE_ZONE):
            spec = parse_zone_subentry(sub)
            runtime = ZoneRuntime(
                spec=spec,
                sensors=ZoneSensors(
                    hass=self.hass,
                    entity_ids=spec.temperature_sensors,
                    mode=spec.aggregation,
                    stale_after=self.config.stale_after,
                    humidity_entity_id=spec.humidity_sensor,
                ),
                actuators=[
                    create_actuator(self.hass, a.entity_id, a.kind, a.role)
                    for a in spec.actuators
                    if a.role != ACTUATOR_ROLE_DEHUMIDIFY  # phase 2
                ],
                user=ZoneUserConfig(),
            )
            for act in runtime.actuators:
                act.probe()
            self.zones[spec.subentry_id] = runtime
            self._async_check_zone_issues(runtime)

        watched: list[str] = []
        for runtime in self.zones.values():
            watched.extend(runtime.spec.temperature_sensors)
            if runtime.spec.humidity_sensor:
                watched.append(runtime.spec.humidity_sensor)
            watched.extend(a.entity_id for a in runtime.actuators)
        if self.config.outdoor_entity_id:
            watched.append(self.config.outdoor_entity_id)

        if watched:
            self._unsub_trackers.append(
                async_track_state_change_event(
                    self.hass, watched, self._async_entity_state_changed
                )
            )
        self._unsub_trackers.append(
            async_track_time_interval(self.hass, self._async_tick, self.update_interval)
        )

    @callback
    def _async_entity_state_changed(self, event: Event[State]) -> None:
        """Re-probe actuators on attribute changes; refresh on sensor changes."""
        entity_id = event.data["entity_id"]
        refreshed = False
        for runtime in self.zones.values():
            for act in runtime.actuators:
                if act.entity_id != entity_id:
                    continue
                # Ignore state changes we caused ourselves (duty windows),
                # otherwise every on/off would trigger another control pass.
                if act.is_own_change(event):
                    continue
                old = act.capabilities
                act.async_on_state_change(event)
                if old != act.capabilities:
                    _LOGGER.debug(
                        "Actuator %s capabilities changed: %s -> %s",
                        entity_id,
                        old.summary(),
                        act.capabilities.summary(),
                    )
                    self._async_check_zone_issues(runtime)
                refreshed = True
        if not refreshed:
            # A sensor (or outdoor) source changed: run a control pass so the
            # new reading is reflected without waiting for the next tick.
            self._async_schedule_refresh()

    @callback
    def _async_schedule_refresh(self) -> None:
        """Kick a debounced control pass (safe from callbacks)."""
        self.hass.async_create_task(self.async_request_refresh())

    @callback
    def _async_tick(self, _now: datetime) -> None:
        self._async_schedule_refresh()

    async def _async_update_data(self) -> GovernorState:
        """Run one control step for every zone."""
        now = dt_util.utcnow()
        outdoor = await self.outdoor.async_read()
        zones: dict[str, ZoneState] = {}
        for zone_id, runtime in self.zones.items():
            try:
                await self._async_step_zone(runtime, now, outdoor)
            except Exception:
                _LOGGER.exception("Error while governing zone %s", zone_id)
            zones[zone_id] = runtime.state
        return GovernorState(zones=zones, outdoor_temp=outdoor, updated_at=now)

    async def _async_step_zone(
        self, runtime: ZoneRuntime, now: datetime, outdoor: float | None
    ) -> None:
        spec = runtime.spec
        user = runtime.user
        state = runtime.state

        current = runtime.sensors.temperature()
        state.current_temp = current
        state.humidity = runtime.sensors.humidity()
        state.outdoor_temp = outdoor
        state.capabilities = runtime.capabilities_summary()

        # --- schedule + presets ---------------------------------------------
        period_objs = [self._as_period(p) for p in self.periods]
        resolution = resolve(
            now, [spec.subentry_id], period_objs, self.options.default_preset
        )
        state.schedule_preset = resolution.preset
        state.next_change = resolution.next_change
        preset = user.preset or resolution.preset
        if user.boost:
            preset = PRESET_BOOST
        state.effective_preset = preset
        preset_sp = self.options.presets.get(preset, {})
        heat_sp = preset_sp.get("heat")
        cool_sp = preset_sp.get("cool")
        if heat_sp is not None:
            heat_sp += user.setpoint_offset
        if cool_sp is not None:
            cool_sp += user.setpoint_offset
        state.target_temp = heat_sp if heat_sp is not None else cool_sp
        state.target_temp_low = heat_sp
        state.target_temp_high = cool_sp

        # --- hvac mode -------------------------------------------------------
        mode = user.hvac_mode
        if not user.enabled:
            mode = HVACMode.OFF.value
        if mode == HVACMode.HEAT_COOL.value:
            # Auto pick based on season when heat_cool requested.
            if self.options.season == SEASON_COOLING:
                mode = HVACMode.COOL.value
            elif self.options.season == SEASON_HEATING:
                mode = HVACMode.HEAT.value
        state.hvac_mode = mode

        heating = (
            mode in (HVACMode.HEAT.value, HVACMode.HEAT_COOL.value)
            and self.master_heat
        )
        cooling = (
            mode in (HVACMode.COOL.value, HVACMode.HEAT_COOL.value)
            and self.master_cool
        )

        blocked = current is None or not runtime.actuators
        state.blocked = blocked

        if blocked or mode == HVACMode.OFF.value:
            await self._async_release_zone(runtime)
            state.action = (
                HVACAction.IDLE.value
                if mode != HVACMode.OFF.value
                else HVACAction.OFF.value
            )
            state.output_heat = 0.0
            state.output_cool = 0.0
            state.active = False
            state.in_comfort = False
            runtime.last_step = now
            return

        # --- control law ------------------------------------------------------
        # HEAT_COOL was resolved to HEAT or COOL above, so exactly one
        # direction is active at a time and the zone shares one integral.
        params = apply_season(
            self.options.control_params(spec.control_overrides), self.options.season
        )
        dt = (now - runtime.last_step).total_seconds() if runtime.last_step else 0.0
        dt = max(0.0, min(dt, 4 * 3600))

        heat_out = 0.0
        cool_out = 0.0
        heat_err = (heat_sp - current) if (heating and heat_sp is not None) else None
        cool_err = (current - cool_sp) if (cooling and cool_sp is not None) else None
        # In HEAT_COOL both directions are enabled; pick the one that needs
        # effort (the larger positive error).
        do_heat = heat_err is not None and (cool_err is None or heat_err >= cool_err)
        do_cool = cool_err is not None and (heat_err is None or cool_err > heat_err)
        if do_heat and heat_err is not None:
            res = step(
                heat_err,
                dt,
                params,
                runtime.control_state,
                outdoor_temp=outdoor,
                mode_is_cooling=False,
            )
            runtime.control_state = res.state
            heat_out = res.output
            state.in_comfort = abs(heat_err) <= params.tolerance
        elif do_cool and cool_err is not None:
            res = step(
                cool_err,
                dt,
                params,
                runtime.control_state,
                outdoor_temp=outdoor,
                mode_is_cooling=True,
            )
            runtime.control_state = res.state
            cool_out = res.output
            state.in_comfort = abs(cool_err) <= params.tolerance
        else:
            # Nothing to do: decay the integral inside the deadband.
            res = step(0.0, dt, params, runtime.control_state, outdoor_temp=outdoor)
            runtime.control_state = res.state
            state.in_comfort = True

        state.output_heat = heat_out
        state.output_cool = cool_out
        state.integral = runtime.control_state.integral

        # --- apply to actuators ----------------------------------------------
        await self._async_apply_zone(
            runtime, heat_out, cool_out, heat_sp, cool_sp, params
        )

        active = heat_out > 0 or cool_out > 0
        state.active = active
        if cooling and cool_out > 0:
            state.action = HVACAction.COOLING.value
        elif heating and heat_out > 0:
            state.action = HVACAction.HEATING.value
        else:
            state.action = HVACAction.IDLE.value
        runtime.last_step = now

    def _as_period(self, spec: PeriodSpec) -> Period:
        return Period(
            subentry_id=spec.subentry_id,
            zones=frozenset(spec.zones),
            days=frozenset(spec.days),
            from_time=spec.from_time,
            to_time=spec.to_time,
            preset=spec.preset,
        )

    async def _async_apply_zone(
        self,
        runtime: ZoneRuntime,
        heat_out: float,
        cool_out: float,
        heat_sp: float | None,
        cool_sp: float | None,
        params: Any,
    ) -> None:
        """Push outputs to the right adapters."""
        state = runtime.state
        window = params.cycle_window or 1

        # Switch valves: duty-cycle windows.
        for act in runtime.switch_actuators:
            output = heat_out if act.role == ACTUATOR_ROLE_HEAT else cool_out
            t_on = duty_window_seconds(output, params)
            await act.async_apply_duty(t_on, params.cycle_window)
        if runtime.switch_actuators:
            scheduled = max(
                duty_window_seconds(
                    heat_out if a.role == ACTUATOR_ROLE_HEAT else cool_out, params
                )
                for a in runtime.switch_actuators
            )
            state.duty_cycle = round(scheduled / window * 100, 1)

        # Climate cascades: setpoint shift + mode (no PWM).
        for act in runtime.climate_actuators:
            cooling = act.role == ACTUATOR_ROLE_COOL
            output = cool_out if cooling else heat_out
            setpoint = (cool_sp if cooling else heat_sp) or state.target_temp
            if setpoint is None:
                continue
            if (
                not act.capabilities.has_target_temperature
                and not act.capabilities.has_target_temperature_range
            ):
                # Mode-only: on when output > 0, off when idle.
                await act.async_set_active(output > 0)
                continue
            offset = setpoint_offset(output, params)
            key = act.entity_id
            applied = runtime.last_applied.get(key)
            if (
                applied
                and abs(applied[0] - output) < 2
                and abs(applied[1] - setpoint) < 0.1
            ):
                continue  # avoid service spam; nothing meaningful changed
            if cooling:
                await act.async_apply_cool(output, setpoint, offset)
            else:
                await act.async_apply_heat(output, setpoint, offset)
            runtime.last_applied[key] = (output, setpoint)

    async def _async_release_zone(self, runtime: ZoneRuntime) -> None:
        for act in runtime.actuators:
            await act.async_stop()
        runtime.last_applied.clear()
        runtime.state.duty_cycle = 0.0

    @callback
    def _async_check_zone_issues(self, runtime: ZoneRuntime) -> None:
        """Create/refresh repair issues for a zone."""
        from .repairs import (
            async_check_zone_issues,  # avoid circular import at module load
        )

        async_check_zone_issues(self.hass, self.config_entry, runtime)

    # --- public API used by the entity layer ---------------------------------

    def zone_runtime(self, zone_subentry_id: str) -> ZoneRuntime | None:
        return self.zones.get(zone_subentry_id)

    @callback
    def async_reset_integral(self, zone_subentry_id: str) -> None:
        runtime = self.zones.get(zone_subentry_id)
        if runtime:
            runtime.control_state = reset_integral(runtime.control_state)
            self.async_update_listeners()

    @callback
    def async_set_user(self, zone_subentry_id: str, **updates: Any) -> None:
        """Write user-config fields and trigger a control pass."""
        runtime = self.zones.get(zone_subentry_id)
        if not runtime:
            return
        for key, value in updates.items():
            setattr(runtime.user, key, value)
        self._async_schedule_refresh()

    @callback
    def async_set_master(self, which: str, enabled: bool) -> None:
        if which == CONF_MASTER_HEAT:
            self.master_heat = enabled
        else:
            self.master_cool = enabled
        self._async_schedule_refresh()

    @property
    def temperature_unit(self) -> str:
        """Unit of the first watched temperature sensor, falling back to HA default."""
        for runtime in self.zones.values():
            for entity_id in runtime.spec.temperature_sensors:
                state = self.hass.states.get(entity_id)
                if state is not None and state.attributes.get("unit_of_measurement"):
                    unit = str(state.attributes["unit_of_measurement"])
                    if unit in (
                        UnitOfTemperature.CELSIUS,
                        UnitOfTemperature.FAHRENHEIT,
                    ):
                        return unit
        return self.hass.config.units.temperature_unit

    def all_actuator_entity_ids(self) -> list[str]:
        return [a.entity_id for r in self.zones.values() for a in r.actuators]

    def capabilities_for(self, zone_subentry_id: str) -> list[ActuatorCapabilities]:
        runtime = self.zones.get(zone_subentry_id)
        return [a.capabilities for a in runtime.actuators] if runtime else []

    @callback
    def async_teardown(self) -> None:
        """Cancel timers and trackers on unload."""
        for unsub in self._unsub_trackers:
            unsub()
        self._unsub_trackers.clear()
        for runtime in self.zones.values():
            if runtime.duty_timer is not None:
                runtime.duty_timer()
                runtime.duty_timer = None
            for act in runtime.switch_actuators:
                act._cancel_window()

    @callback
    def async_sync_areas(self) -> None:
        """Point zone devices at the area chosen in their zone subentry.

        ``DeviceInfo`` carries no ``area_id`` (and ``suggested_area`` is
        deprecated), so the area is applied to the device registry after the
        zone devices exist. Runs on every entry (re)load, so a zone
        reconfigure that changes the area takes effect. An empty subentry
        area never overrides an area the user assigned on the device page.
        """
        dev_reg = dr.async_get(self.hass)
        entry_id = self.config_entry.entry_id
        for runtime in self.zones.values():
            area_id = runtime.spec.area_id
            if area_id is None:
                continue
            device = dev_reg.async_get_device_by_identifier(
                (DOMAIN, runtime.spec.subentry_id), entry_id
            )
            if device is not None and device.area_id != area_id:
                dev_reg.async_update_device(device.id, area_id=area_id)

    @callback
    def async_device_info(self, zone: ZoneRuntime) -> dr.DeviceInfo:
        """Device info for a zone's virtual device."""
        return dr.DeviceInfo(
            identifiers={(DOMAIN, zone.spec.subentry_id)},
            name=zone.spec.name,
            entry_type=dr.DeviceEntryType.SERVICE,
            configuration_url=None,
        )

    @callback
    def async_gateway_device_info(self) -> dr.DeviceInfo:
        entry = self.config_entry
        return dr.DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=self.config.name,
            entry_type=dr.DeviceEntryType.SERVICE,
        )
