"""Binary sensors for Climate Governor: actuator active / blocked / in-comfort."""

from typing import override

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import ClimateGovernorConfigEntry, GovernorCoordinator, ZoneRuntime
from .entity import GovernorZoneEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ClimateGovernorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add per-zone binary sensors."""
    coordinator = entry.runtime_data
    for zone_id, runtime in coordinator.zones.items():
        async_add_entities(
            [
                ZoneActiveBinarySensor(coordinator, runtime),
                ZoneBlockedBinarySensor(coordinator, runtime),
                ZoneComfortBinarySensor(coordinator, runtime),
            ],
            config_subentry_id=zone_id,
        )


class ZoneBinarySensorBase(GovernorZoneEntity, BinarySensorEntity):
    """Common wiring for a per-zone binary sensor."""

    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime, key: str
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, runtime)
        self._attr_translation_key = key
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}-{key}"
        )


class ZoneActiveBinarySensor(ZoneBinarySensorBase):
    """True while any actuator of the zone is driving."""

    _attr_device_class = BinarySensorDeviceClass.RUNNING

    def __init__(self, coordinator: GovernorCoordinator, runtime: ZoneRuntime) -> None:
        """Initialize."""
        super().__init__(coordinator, runtime, "actuator_active")

    @property
    @override
    def is_on(self) -> bool:
        return self._runtime.state.active


class ZoneBlockedBinarySensor(ZoneBinarySensorBase):
    """True when the zone cannot be governed (no reading or no actuator)."""

    def __init__(self, coordinator: GovernorCoordinator, runtime: ZoneRuntime) -> None:
        """Initialize."""
        super().__init__(coordinator, runtime, "blocked")

    @property
    @override
    def is_on(self) -> bool:
        return self._runtime.state.blocked


class ZoneComfortBinarySensor(ZoneBinarySensorBase):
    """True while the measured temperature is inside the deadband."""

    def __init__(self, coordinator: GovernorCoordinator, runtime: ZoneRuntime) -> None:
        """Initialize."""
        super().__init__(coordinator, runtime, "in_comfort")

    @property
    @override
    def is_on(self) -> bool:
        return self._runtime.state.in_comfort
