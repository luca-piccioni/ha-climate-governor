"""Climate Governor integration."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    CONF_NAME,
    CONF_OUTDOOR_DESIGN_TEMP,
    CONF_OUTDOOR_ENTITY_ID,
    DEFAULT_OUTDOOR_DESIGN_TEMP,
    DOMAIN,
    PLATFORMS,
    SUBENTRY_TYPE_ZONE,
)
from .coordinator import ClimateGovernorConfigEntry, GovernorCoordinator
from .repairs import async_setup_repairs

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Climate Governor integration."""
    async_setup_repairs(hass)
    return True


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Migrate old entries to the current version."""
    if entry.version > 1:
        return True

    # v1 entries were created with empty data by the old scaffold flow.
    data = dict(entry.data)
    data.setdefault(CONF_NAME, "Climate Governor")
    data.setdefault(CONF_OUTDOOR_ENTITY_ID, None)
    data.setdefault(CONF_OUTDOOR_DESIGN_TEMP, DEFAULT_OUTDOOR_DESIGN_TEMP)
    hass.config_entries.async_update_entry(entry, data=data, version=2)
    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: ClimateGovernorConfigEntry
) -> bool:
    """Set up Climate Governor from a config entry."""
    if not entry.get_subentries_of_type(SUBENTRY_TYPE_ZONE):
        raise ConfigEntryError(
            translation_domain=DOMAIN,
            translation_key="no_zone_configured",
        )

    coordinator = GovernorCoordinator(hass, entry)
    await coordinator.async_setup()
    await coordinator.async_refresh()

    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Zone devices now exist, so the area picked in each zone subentry can be
    # applied to them.
    coordinator.async_sync_areas()

    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    entry.async_on_unload(coordinator.async_teardown)

    return True


async def _async_update_listener(
    hass: HomeAssistant, entry: ClimateGovernorConfigEntry
) -> None:
    """Handle config entry updates (options, data or subentry changes)."""
    hass.config_entries.async_schedule_reload(entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant, entry: ClimateGovernorConfigEntry
) -> bool:
    """Unload a Climate Governor config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)