"""Number entities for Climate Governor: per-zone tuning (EntityCategory.CONFIG)."""

from typing import override

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.const import EntityCategory, UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import ClimateGovernorConfigEntry, GovernorCoordinator, ZoneRuntime
from .entity import GovernorZoneEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ClimateGovernorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add tuning numbers for every zone subentry."""
    coordinator = entry.runtime_data
    for zone_id, runtime in coordinator.zones.items():
        async_add_entities(
            [
                ZoneToleranceNumber(coordinator, runtime),
                ZoneKpNumber(coordinator, runtime),
                ZoneKiNumber(coordinator, runtime),
                ZoneSetpointOffsetNumber(coordinator, runtime),
            ],
            config_subentry_id=zone_id,
        )


class ZoneTuningNumber(GovernorZoneEntity, NumberEntity):
    """Base for a per-zone tuning number writing into the zone user config."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.BOX

    _user_field: str

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the number."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            f"-{self._attr_translation_key}"
        )

    @property
    @override
    def native_value(self) -> float | None:
        return getattr(self._runtime.user, self._user_field)

    @override
    async def async_set_native_value(self, value: float) -> None:
        self.coordinator.async_set_user(
            self._zone_subentry_id, **{self._user_field: value}
        )


class ZoneToleranceNumber(ZoneTuningNumber):
    _attr_translation_key = "tolerance"
    _attr_native_min_value = 0.1
    _attr_native_max_value = 3.0
    _attr_native_step = 0.1
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _user_field = "tolerance"

    @property
    @override
    def native_value(self) -> float | None:
        value = self._runtime.user.tolerance
        return value if value is not None else self.coordinator.options.tolerance


class ZoneKpNumber(ZoneTuningNumber):
    _attr_translation_key = "kp"
    _attr_native_min_value = 0.0
    _attr_native_max_value = 200.0
    _attr_native_step = 1.0
    _user_field = "kp"

    @property
    @override
    def native_value(self) -> float | None:
        value = self._runtime.user.kp
        return value if value is not None else self.coordinator.options.kp


class ZoneKiNumber(ZoneTuningNumber):
    _attr_translation_key = "ki"
    _attr_native_min_value = 0.0
    _attr_native_max_value = 100.0
    _attr_native_step = 0.5
    _user_field = "ki"

    @property
    @override
    def native_value(self) -> float | None:
        value = self._runtime.user.ki
        return value if value is not None else self.coordinator.options.ki


class ZoneSetpointOffsetNumber(ZoneTuningNumber):
    _attr_translation_key = "setpoint_offset"
    _attr_native_min_value = -5.0
    _attr_native_max_value = 5.0
    _attr_native_step = 0.1
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _user_field = "setpoint_offset"
