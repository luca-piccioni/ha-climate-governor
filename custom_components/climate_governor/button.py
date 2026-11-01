"""Button entities for Climate Governor: reset the PI integral per zone."""

from typing import override

from homeassistant.components.button import ButtonEntity
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
    """Add a reset-integral button for every zone."""
    coordinator = entry.runtime_data
    for zone_id, runtime in coordinator.zones.items():
        async_add_entities(
            [ZoneResetIntegralButton(coordinator, runtime)],
            config_subentry_id=zone_id,
        )


class ZoneResetIntegralButton(GovernorZoneEntity, ButtonEntity):
    """Clear the accumulated integral term of a zone controller."""

    _attr_translation_key = "reset_integral"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the button."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-reset_integral"
        )

    @override
    async def async_press(self) -> None:
        self.coordinator.async_reset_integral(self._zone_subentry_id)
