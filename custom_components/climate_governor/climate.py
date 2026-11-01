"""Climate platform for Climate Governor: one virtual thermostat per zone."""

from typing import Any, override

import probatio
from homeassistant.components.climate import (
    ClimateEntity,
    ClimateEntityFeature,
    HVACAction,
    HVACMode,
)
from homeassistant.const import ATTR_TEMPERATURE
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_platform
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import PRESET_AWAY, PRESET_BOOST, PRESET_COMFORT, PRESET_ECO, PRESET_SLEEP
from .coordinator import ClimateGovernorConfigEntry, GovernorCoordinator, ZoneRuntime
from .entity import GovernorZoneEntity

PRESET_ORDER = (PRESET_ECO, PRESET_COMFORT, PRESET_BOOST, PRESET_AWAY, PRESET_SLEEP)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ClimateGovernorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one climate entity per zone subentry."""
    coordinator = entry.runtime_data
    for zone_id, runtime in coordinator.zones.items():
        async_add_entities(
            [GovernorClimateEntity(coordinator, runtime)],
            config_subentry_id=zone_id,
        )

    platform = entity_platform.async_get_current_platform()
    platform.async_register_entity_service(
        "reset_integral",
        {},
        "async_reset_integral_service",
    )
    platform.async_register_entity_service(
        "set_hold",
        {probatio.Required("preset"): str},
        "async_set_hold_service",
    )


class GovernorClimateEntity(
    GovernorZoneEntity, ClimateEntity, RestoreEntity
):
    """Virtual thermostat representing one governed zone."""

    _attr_name = None
    _attr_translation_key = "zone"

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the zone thermostat."""
        super().__init__(coordinator, runtime)
        entry_id = coordinator.config_entry.entry_id
        self._attr_unique_id = f"{entry_id}-zone-{runtime.spec.subentry_id}"

    @property
    @override
    def available(self) -> bool:
        return (
            self.coordinator.last_update_success
            and self._runtime.state.current_temp is not None
        )

    @property
    @override
    def temperature_unit(self) -> str:
        return self.coordinator.temperature_unit

    @property
    @override
    def hvac_mode(self) -> HVACMode:
        mode = self._runtime.state.hvac_mode
        try:
            return HVACMode(mode)
        except ValueError:
            return HVACMode.OFF

    @property
    @override
    def hvac_modes(self) -> list[HVACMode]:
        return [HVACMode.OFF, HVACMode.HEAT, HVACMode.COOL, HVACMode.HEAT_COOL]

    @property
    @override
    def hvac_action(self) -> HVACAction:
        action = self._runtime.state.action
        try:
            return HVACAction(action)
        except ValueError:
            return HVACAction.IDLE

    @property
    @override
    def current_temperature(self) -> float | None:
        return self._runtime.state.current_temp

    @property
    @override
    def target_temperature(self) -> float | None:
        mode = self._runtime.state.hvac_mode
        if mode == HVACMode.COOL.value:
            return self._runtime.state.target_temp_high
        return self._runtime.state.target_temp_low

    @property
    @override
    def target_temperature_high(self) -> float | None:
        if self.hvac_mode is HVACMode.HEAT_COOL:
            return self._runtime.state.target_temp_high
        return None

    @property
    @override
    def target_temperature_low(self) -> float | None:
        if self.hvac_mode is HVACMode.HEAT_COOL:
            return self._runtime.state.target_temp_low
        return None

    @property
    @override
    def current_humidity(self) -> float | None:
        return self._runtime.state.humidity

    @property
    @override
    def supported_features(self) -> ClimateEntityFeature:
        features = ClimateEntityFeature.PRESET_MODE
        mode = self._runtime.state.hvac_mode
        if mode == HVACMode.HEAT_COOL.value:
            features |= ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
        else:
            features |= ClimateEntityFeature.TARGET_TEMPERATURE
        return features

    @property
    @override
    def min_temp(self) -> float:
        return 5.0

    @property
    @override
    def max_temp(self) -> float:
        return 40.0

    @property
    @override
    def target_temperature_step(self) -> float:
        return 0.5

    @property
    @override
    def preset_mode(self) -> str | None:
        return self._runtime.state.effective_preset or None

    @property
    @override
    def preset_modes(self) -> list[str]:
        return [p for p in PRESET_ORDER if p in self.coordinator.options.presets]

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        """Set the zone mode and refresh."""
        self.coordinator.async_set_user(
            self._zone_subentry_id, hvac_mode=hvac_mode.value
        )

    async def async_set_temperature(self, **kwargs: Any) -> None:
        """Move the effective preset's setpoints by the requested delta.

        The governor keeps setpoints inside presets; a manual temperature is
        stored as a per-zone offset from the scheduled preset.
        """
        runtime = self._runtime
        state = runtime.state
        if self.hvac_mode is HVACMode.HEAT_COOL:
            low = kwargs.get("target_temp_low")
            high = kwargs.get("target_temp_high")
            if low is not None and state.target_temp_low:
                runtime.user.setpoint_offset += low - state.target_temp_low
            if high is not None and state.target_temp_high:
                runtime.user.setpoint_offset += high - state.target_temp_high
        else:
            temp = kwargs.get(ATTR_TEMPERATURE)
            current = self.target_temperature
            if temp is not None and current is not None:
                runtime.user.setpoint_offset += temp - current
        self.coordinator.async_set_user(self._zone_subentry_id)

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        """Hold a preset until the schedule takes over again (preset=None)."""
        self.coordinator.async_set_user(
            self._zone_subentry_id, preset=preset_mode
        )

    @callback
    def async_reset_integral_service(self) -> None:
        """Expose the reset-integral entity service."""
        self.coordinator.async_reset_integral(self._zone_subentry_id)

    @callback
    def async_set_hold_service(self, preset: str) -> None:
        """Expose the set-hold entity service ("schedule" releases the hold)."""
        value = None if preset == "schedule" else preset
        self.coordinator.async_set_user(self._zone_subentry_id, preset=value)

    @override
    async def async_added_to_hass(self) -> None:
        """Restore the user's last mode/preset/offset."""
        await super().async_added_to_hass()
        if (last := await self.async_get_last_state()) is not None:
            runtime = self._runtime
            if last.state in (m.value for m in HVACMode):
                runtime.user.hvac_mode = last.state
            preset = last.attributes.get("preset_mode")
            if isinstance(preset, str) and preset in self.coordinator.options.presets:
                runtime.user.preset = preset
