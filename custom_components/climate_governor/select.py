"""Select entities for Climate Governor: season and per-zone preset hold."""

from typing import override

from homeassistant.components.select import SelectEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    CONF_SEASON,
    SEASON_COOLING,
    SEASON_HEATING,
    SEASON_SHOULDER,
)
from .coordinator import ClimateGovernorConfigEntry, GovernorCoordinator, ZoneRuntime
from .entity import GovernorGatewayEntity, GovernorZoneEntity

SEASONS = [SEASON_HEATING, SEASON_SHOULDER, SEASON_COOLING]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ClimateGovernorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the season select (entry-level) and preset hold selects (per zone)."""
    coordinator = entry.runtime_data
    async_add_entities([SeasonSelect(coordinator)])
    for zone_id, runtime in coordinator.zones.items():
        async_add_entities(
            [ZonePresetHoldSelect(coordinator, runtime)],
            config_subentry_id=zone_id,
        )


class SeasonSelect(GovernorGatewayEntity, SelectEntity):
    """Pick the active season (scales gains, tolerance and outdoor reset)."""

    _attr_translation_key = "season"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator: GovernorCoordinator) -> None:
        """Initialize the select."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}-{CONF_SEASON}"

    @property
    @override
    def current_option(self) -> str:
        return self.coordinator.options.season

    @property
    @override
    def options(self) -> list[str]:
        return SEASONS

    @override
    async def async_select_option(self, option: str) -> None:
        self.hass.config_entries.async_update_entry(
            self.coordinator.config_entry,
            options=self.coordinator.config_entry.options | {CONF_SEASON: option},
        )


class ZonePresetHoldSelect(GovernorZoneEntity, SelectEntity):
    """Hold a preset for the zone, or follow the schedule ("schedule")."""

    _attr_translation_key = "preset_hold"
    _attr_entity_category = EntityCategory.CONFIG

    FOLLOW_SCHEDULE = "schedule"

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the select."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-preset_hold"
        )

    @property
    @override
    def current_option(self) -> str:
        return self._runtime.user.preset or self.FOLLOW_SCHEDULE

    @property
    @override
    def options(self) -> list[str]:
        return [self.FOLLOW_SCHEDULE, *self.coordinator.options.presets]

    @override
    async def async_select_option(self, option: str) -> None:
        preset = None if option == self.FOLLOW_SCHEDULE else option
        self.coordinator.async_set_user(self._zone_subentry_id, preset=preset)
