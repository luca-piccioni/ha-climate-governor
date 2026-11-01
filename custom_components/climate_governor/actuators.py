"""Capability-probing actuator adapters for Climate Governor.

Each actuator is probed from its state attributes at setup (and re-probed when
attributes change), so the governor tolerates actuators that lack
TARGET_TEMPERATURE, or have DRY mode without TARGET_HUMIDITY (phase 2).
"""

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ClimateEntityFeature,
    HVACMode,
)
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
)
from homeassistant.components.switch import (
    DOMAIN as SWITCH_DOMAIN,
)
from homeassistant.components.switch import (
    SERVICE_TURN_OFF,
    SERVICE_TURN_ON,
)
from homeassistant.const import (
    ATTR_ENTITY_ID,
    STATE_ON,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import Context, Event, HomeAssistant, State, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.event import async_call_later

from .const import ACTUATOR_KIND_CLIMATE, ACTUATOR_ROLE_COOL

_LOGGER = logging.getLogger(__name__)

CONTEXT_RECENT_TIME_SECONDS = 5
MIN_TARGET_TEMP_DEFAULT = 7.0
MAX_TARGET_TEMP_DEFAULT = 35.0


@dataclass(frozen=True, slots=True)
class ActuatorCapabilities:
    """Capabilities probed from an actuator's state attributes."""

    has_target_temperature: bool = False
    has_target_temperature_range: bool = False
    has_target_humidity: bool = False
    has_fan_mode: bool = False
    has_preset_mode: bool = False
    supports_dry: bool = False
    supports_heat: bool = False
    supports_cool: bool = False
    supports_heat_cool: bool = False
    supports_turn_on: bool = False
    supports_turn_off: bool = False
    min_temp: float = MIN_TARGET_TEMP_DEFAULT
    max_temp: float = MAX_TARGET_TEMP_DEFAULT
    target_temp_step: float = 0.1
    preset_modes: tuple[str, ...] = ()

    def summary(self) -> str:
        """Short human-readable summary for the diagnostic sensor."""
        parts: list[str] = []
        if self.has_target_temperature:
            parts.append("target_temp")
        if self.has_target_temperature_range:
            parts.append("target_range")
        if self.supports_heat:
            parts.append("heat")
        if self.supports_cool:
            parts.append("cool")
        if self.supports_dry:
            parts.append("dry")
        if self.has_target_humidity:
            parts.append("target_humidity")
        return ", ".join(parts) or "mode-only"


@dataclass(slots=True)
class ActuatorAdapter:
    """Base adapter: probes capabilities and applies control to one entity."""

    hass: HomeAssistant
    entity_id: str
    kind: str
    role: str
    capabilities: ActuatorCapabilities = field(default_factory=ActuatorCapabilities)
    _own_context_id: str | None = field(default=None, repr=False)
    _context_set: float | None = field(default=None, repr=False)

    @property
    def available(self) -> bool:
        state = self.hass.states.get(self.entity_id)
        return state is not None and state.state not in (
            STATE_UNAVAILABLE,
            STATE_UNKNOWN,
        )

    def probe(self) -> ActuatorCapabilities:
        """Probe capabilities from the current state attributes."""
        state = self.hass.states.get(self.entity_id)
        if state is None:
            self.capabilities = ActuatorCapabilities()
            return self.capabilities
        self.capabilities = self._probe_state(state)
        return self.capabilities

    def _probe_state(self, state: State) -> ActuatorCapabilities:  # noqa: PLR6201
        return ActuatorCapabilities()

    @callback
    def async_on_state_change(self, event: Event[State]) -> None:
        """Re-probe when attributes changed."""
        new_state = event.data.get("new_state")
        if new_state is not None:
            self.capabilities = self._probe_state(new_state)

    @callback
    def _get_own_context(self) -> Context:
        """Create a child context so we can recognise our own state changes."""
        parent = self._current_own_context_id()
        new_context = Context(parent_id=parent)
        self._own_context_id = new_context.id
        self._context_set = time.time()
        return new_context

    @callback
    def _current_own_context_id(self) -> str | None:
        if (
            self._context_set is not None
            and time.time() - self._context_set > CONTEXT_RECENT_TIME_SECONDS
        ):
            self._own_context_id = None
            self._context_set = None
        return self._own_context_id

    @callback
    def is_own_change(self, event: Event[State]) -> bool:
        """Whether a state-change event was caused by this adapter."""
        own = self._current_own_context_id()
        return own is not None and (
            event.context.id == own or event.context.parent_id == own
        )

    async def async_apply_heat(
        self, output: float, setpoint: float, offset: float = 0.0
    ) -> None:
        """Apply heating output (0..100) with the zone setpoint and shift."""

    async def async_apply_cool(
        self, output: float, setpoint: float, offset: float = 0.0
    ) -> None:
        """Apply cooling output (0..100) with the zone setpoint and shift."""

    async def async_stop(self) -> None:
        """Release the actuator (turn off / stop pushing setpoints)."""

    async def async_set_active(self, active: bool) -> None:
        """Turn the underlying entity on or off (master enable)."""


@dataclass(slots=True)
class SwitchValveActuator(ActuatorAdapter):
    """Motorized valve on a switch entity, driven by a duty-cycle window.

    Mirrors generic_thermostat's timer approach: the coordinator computes the
    ON-time for the current window, and this adapter schedules the off (and
    the next window's on) with ``async_call_later``.
    """

    _on_callback: Any = field(default=None, repr=False)
    _off_callback: Any = field(default=None, repr=False)
    _end_callback: Any = field(default=None, repr=False)
    _window_open: bool = field(default=False, repr=False)
    _window_start: float | None = field(default=None, repr=False)
    _window_on_seconds: float = field(default=0.0, repr=False)
    _window_length: float = field(default=0.0, repr=False)

    def _probe_state(self, state: State) -> ActuatorCapabilities:
        return ActuatorCapabilities(supports_turn_on=True, supports_turn_off=True)

    @property
    def is_on(self) -> bool:
        return self.hass.states.is_state(self.entity_id, STATE_ON)

    async def async_apply_duty(self, on_seconds: float, window: float) -> None:
        """Apply the duty cycle for the current window.

        The coordinator re-applies every tick, so a running window must not be
        restarted (that would extend the ON phase and starve the OFF time).
        While a window is open the request is ignored; the window's end timer
        closes it so the next tick starts a fresh one. A zero output always
        cancels the window and turns the valve off immediately.
        """
        if on_seconds <= 0:
            self._cancel_window()
            await self._async_turn_off()
            return
        if self._window_open:
            return  # window still running; its end timer will close it
        self._window_open = True
        self._window_length = window
        self._window_start = self.hass.loop.time()
        self._window_on_seconds = on_seconds
        await self._async_turn_on()
        self._off_callback = async_call_later(
            self.hass, on_seconds, self._async_window_off
        )
        self._end_callback = async_call_later(
            self.hass, window, self._async_window_end
        )

    @callback
    def _async_window_off(self, _now: Any) -> None:
        self._off_callback = None
        self.hass.async_create_task(self._async_turn_off())

    @callback
    def _async_window_end(self, _now: Any) -> None:
        """The full cycle window elapsed; the next apply opens a new one."""
        self._end_callback = None
        self._window_open = False
        self._window_start = None

    @callback
    def _async_window_off(self, _now: Any) -> None:
        self._off_callback = None
        self.hass.async_create_task(self._async_turn_off())

    async def _async_turn_on(self) -> None:
        if self.is_on:
            return
        await self.hass.services.async_call(
            SWITCH_DOMAIN,
            SERVICE_TURN_ON,
            {ATTR_ENTITY_ID: self.entity_id},
            blocking=True,
            context=self._get_own_context(),
        )

    async def _async_turn_off(self) -> None:
        if not self.is_on:
            return
        await self.hass.services.async_call(
            SWITCH_DOMAIN,
            SERVICE_TURN_OFF,
            {ATTR_ENTITY_ID: self.entity_id},
            blocking=True,
            context=self._get_own_context(),
        )

    async def async_stop(self) -> None:
        self._cancel_window()
        await self._async_turn_off()

    async def async_set_active(self, active: bool) -> None:
        if not active:
            self._cancel_window()
            await self._async_turn_off()

    def _cancel_window(self) -> None:
        for attr in ("_on_callback", "_off_callback", "_end_callback"):
            cb = getattr(self, attr)
            if cb is not None:
                cb()
                setattr(self, attr, None)
        self._window_open = False
        self._window_start = None

    @property
    def window_remaining(self) -> float | None:
        """Seconds of ON time left in the current window (None when idle)."""
        if self._window_start is None:
            return None
        elapsed = self.hass.loop.time() - self._window_start
        return max(0.0, self._window_on_seconds - elapsed)


@dataclass(slots=True)
class ClimateCascadeActuator(ActuatorAdapter):
    """Inverter / heat-pump climate entity, driven by setpoint shift + mode.

    Capability-driven:
    - with TARGET_TEMPERATURE: pushes ``zone_setpoint ± offset`` and selects
      heat/cool/heat_cool mode;
    - **without** TARGET_TEMPERATURE: mode-only control (hvac_mode +
      turn_on/turn_off); the zone setpoint stays internal to the governor;
    - DRY without TARGET_HUMIDITY (phase 2): dry mode on/off only, never
      calls ``climate.set_humidity``.
    """

    def _probe_state(self, state: State) -> ActuatorCapabilities:
        attrs = state.attributes
        features = int(attrs.get("supported_features", 0) or 0)
        hvac_modes = [str(m) for m in attrs.get("hvac_modes", []) or []]
        min_temp = float(attrs.get("min_temp", MIN_TARGET_TEMP_DEFAULT))
        max_temp = float(attrs.get("max_temp", MAX_TARGET_TEMP_DEFAULT))
        step = float(attrs.get("target_temp_step", 0.1) or 0.1)
        return ActuatorCapabilities(
            has_target_temperature=bool(
                features & ClimateEntityFeature.TARGET_TEMPERATURE
            ),
            has_target_temperature_range=bool(
                features & ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
            ),
            has_target_humidity=bool(features & ClimateEntityFeature.TARGET_HUMIDITY),
            has_fan_mode=bool(features & ClimateEntityFeature.FAN_MODE),
            has_preset_mode=bool(features & ClimateEntityFeature.PRESET_MODE),
            supports_dry=HVACMode.DRY.value in hvac_modes,
            supports_heat=HVACMode.HEAT.value in hvac_modes,
            supports_cool=HVACMode.COOL.value in hvac_modes,
            supports_heat_cool=HVACMode.HEAT_COOL.value in hvac_modes,
            supports_turn_on=bool(
                features & ClimateEntityFeature.TURN_ON
            ),
            supports_turn_off=bool(
                features & ClimateEntityFeature.TURN_OFF
            ),
            min_temp=min_temp,
            max_temp=max_temp,
            target_temp_step=step,
            preset_modes=tuple(str(m) for m in attrs.get("preset_modes", []) or []),
        )

    @property
    def current_hvac_mode(self) -> str | None:
        state = self.hass.states.get(self.entity_id)
        return state.state if state is not None else None

    def _snap_temp(self, value: float) -> float:
        caps = self.capabilities
        value = max(caps.min_temp, min(caps.max_temp, value))
        if caps.target_temp_step > 0:
            snapped = round(value / caps.target_temp_step) * caps.target_temp_step
            value = max(caps.min_temp, min(caps.max_temp, round(snapped, 2)))
        return value

    async def async_apply_heat(
        self, output: float, setpoint: float, offset: float = 0.0
    ) -> None:
        await self._async_apply(output, setpoint, offset, cooling=False)

    async def async_apply_cool(
        self, output: float, setpoint: float, offset: float = 0.0
    ) -> None:
        await self._async_apply(output, setpoint, offset, cooling=True)

    async def _async_apply(
        self, output: float, setpoint: float, offset: float, *, cooling: bool
    ) -> None:
        caps = self.capabilities
        mode = self._pick_mode(caps, cooling)
        if offset <= 0:
            # Fall back to a default shift if the caller supplied none.
            offset = output / 100.0 * 1.5
        if caps.has_target_temperature:
            # More output -> push the target further from the zone setpoint.
            target = setpoint - offset if cooling else setpoint + offset
            await self._async_call(
                CLIMATE_DOMAIN,
                "set_temperature",
                {
                    ATTR_ENTITY_ID: self.entity_id,
                    ATTR_HVAC_MODE: mode,
                    "temperature": self._snap_temp(target),
                },
            )
        elif caps.has_target_temperature_range:
            await self._async_call(
                CLIMATE_DOMAIN,
                "set_temperature",
                {
                    ATTR_ENTITY_ID: self.entity_id,
                    ATTR_HVAC_MODE: mode,
                    ATTR_TARGET_TEMP_LOW: self._snap_temp(setpoint - offset),
                    ATTR_TARGET_TEMP_HIGH: self._snap_temp(setpoint + offset),
                },
            )
        else:
            # Mode-only fallback: never call set_temperature.
            await self._async_set_mode(mode)

    def _pick_mode(self, caps: ActuatorCapabilities, cooling: bool) -> str:
        if caps.supports_heat_cool:
            return HVACMode.HEAT_COOL.value
        return HVACMode.COOL.value if cooling else HVACMode.HEAT.value

    async def _async_set_mode(self, mode: str) -> None:
        if self.current_hvac_mode == mode:
            return
        try:
            await self._async_call(
                CLIMATE_DOMAIN,
                "set_hvac_mode",
                {ATTR_ENTITY_ID: self.entity_id, ATTR_HVAC_MODE: mode},
            )
        except ServiceValidationError:
            # Mode not supported (e.g. heat_cool missing) — fall back to on/off.
            await self._async_call(
                CLIMATE_DOMAIN, "turn_on", {ATTR_ENTITY_ID: self.entity_id}
            )

    async def async_stop(self) -> None:
        caps = self.capabilities
        if caps.supports_turn_off:
            await self._async_call(
                CLIMATE_DOMAIN, "turn_off", {ATTR_ENTITY_ID: self.entity_id}
            )
        elif self.current_hvac_mode not in (None, HVACMode.OFF.value):
            await self._async_call(
                CLIMATE_DOMAIN,
                "set_hvac_mode",
                {ATTR_ENTITY_ID: self.entity_id, ATTR_HVAC_MODE: HVACMode.OFF.value},
            )

    async def async_set_active(self, active: bool) -> None:
        caps = self.capabilities
        if active:
            if caps.supports_turn_on:
                await self._async_call(
                    CLIMATE_DOMAIN, "turn_on", {ATTR_ENTITY_ID: self.entity_id}
                )
            else:
                # No TURN_ON feature: drive the hvac mode directly instead.
                cooling = self.role == ACTUATOR_ROLE_COOL
                await self._async_set_mode(self._pick_mode(caps, cooling))
        elif caps.supports_turn_off:
            await self._async_call(
                CLIMATE_DOMAIN, "turn_off", {ATTR_ENTITY_ID: self.entity_id}
            )
        elif self.current_hvac_mode not in (None, HVACMode.OFF.value):
            await self._async_set_mode(HVACMode.OFF.value)

    async def _async_call(self, domain: str, service: str, data: dict) -> None:
        await self.hass.services.async_call(
            domain, service, data, blocking=True, context=self._get_own_context()
        )


def create_actuator(
    hass: HomeAssistant, entity_id: str, kind: str, role: str
) -> ActuatorAdapter:
    """Build the right adapter for the configured actuator kind."""
    if kind == ACTUATOR_KIND_CLIMATE:
        return ClimateCascadeActuator(
            hass=hass, entity_id=entity_id, kind=kind, role=role
        )
    return SwitchValveActuator(hass=hass, entity_id=entity_id, kind=kind, role=role)
