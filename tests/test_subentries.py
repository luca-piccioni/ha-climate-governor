"""Tests for zone/period subentry add, reconfigure and removal."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.climate_governor.const import (
    CONF_PRESET,
    DOMAIN,
    SUBENTRY_TYPE_PERIOD,
    SUBENTRY_TYPE_ZONE,
)
from tests.conftest import base_entry_data, period_subentry_data, zone_subentry_data
from tests.fixtures import ZONE_SUBENTRY_ID

PERIOD_INPUT = {
    "zones": [ZONE_SUBENTRY_ID],
    "days": ["mon", "tue", "wed", "thu", "fri"],
    "from_time": "06:30",
    "to_time": "08:30",
    "preset": "eco",
}


async def test_add_period_subentry_reloads_and_resolves(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """A new period subentry is created and picked up after the reload."""
    result = await hass.config_entries.subentries.async_init(
        (loaded_entry.entry_id, SUBENTRY_TYPE_PERIOD), context={"source": "user"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], user_input=PERIOD_INPUT
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "mon,tue,wed,thu,fri 06:30:00-08:30:00 eco"
    await hass.async_block_till_done()

    # The update listener reloads the entry; the coordinator sees the period.
    assert loaded_entry.state is ConfigEntryState.LOADED
    coordinator = loaded_entry.runtime_data
    assert len(coordinator.periods) == 1
    assert coordinator.periods[0].preset == "eco"


async def test_period_subentry_errors(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The period form requires at least one zone and one day."""
    result = await hass.config_entries.subentries.async_init(
        (loaded_entry.entry_id, SUBENTRY_TYPE_PERIOD), context={"source": "user"}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], user_input={**PERIOD_INPUT, "zones": []}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"zones": "no_zones"}

    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], user_input={**PERIOD_INPUT, "days": []}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"days": "no_days"}

    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], user_input=PERIOD_INPUT
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY


async def test_reconfigure_period_subentry(hass: HomeAssistant) -> None:
    """A period subentry can be reconfigured in place."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        title="Test Plant",
        version=2,
        data=base_entry_data(),
        subentries_data=[zone_subentry_data(), period_subentry_data()],
    )
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.LOADED

    result = await entry.start_subentry_reconfigure_flow(hass, "period-morning")
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "reconfigure"

    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        user_input={**PERIOD_INPUT, "preset": "boost"},
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    await hass.async_block_till_done()

    subentry = entry.subentries["period-morning"]
    assert subentry.data[CONF_PRESET] == "boost"
    assert entry.state is ConfigEntryState.LOADED


async def test_add_zone_subentry_creates_entities(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Adding a second zone subentry creates its entities after reload."""
    hass.states.async_set("sensor.bedroom_temp", "20.0", {"unit_of_measurement": "°C"})
    result = await hass.config_entries.subentries.async_init(
        (loaded_entry.entry_id, SUBENTRY_TYPE_ZONE), context={"source": "user"}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        user_input={
            "zone_name": "Bedroom",
            "temperature_sensors": ["sensor.bedroom_temp"],
            "heat_switch": "switch.valve2",
            "aggregation": "mean",
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()

    assert loaded_entry.state is ConfigEntryState.LOADED
    assert hass.states.get("climate.bedroom") is not None
    assert hass.states.get("climate.living") is not None
    coordinator = loaded_entry.runtime_data
    assert len(coordinator.zones) == 2


async def test_remove_zone_subentry_removes_entities(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Deleting a zone subentry removes the entities registered under it."""
    registry = er.async_get(hass)
    assert registry.async_get("climate.living") is not None

    hass.config_entries.async_remove_subentry(loaded_entry, ZONE_SUBENTRY_ID)
    await hass.async_block_till_done()

    # The subentry's entities are purged from the registry...
    assert registry.async_get("climate.living") is None
    assert registry.async_get("sensor.living_duty_cycle") is None
    # ...and the entry itself now fails setup (no zone left).
    assert loaded_entry.state is ConfigEntryState.SETUP_ERROR


async def test_options_change_reloads_without_orphans(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """An options update reloads the entry cleanly (checklist item 7)."""
    hass.config_entries.async_update_entry(loaded_entry, options={"season": "cooling"})
    await hass.async_block_till_done()

    assert loaded_entry.state is ConfigEntryState.LOADED
    coordinator = loaded_entry.runtime_data
    assert coordinator.options.season == "cooling"
    # Entities come back under the same ids; no duplicates or orphans.
    registry = er.async_get(hass)
    entries = list(er.async_entries_for_config_entry(registry, loaded_entry.entry_id))
    ids = [e.entity_id for e in entries]
    assert ids.count("climate.living") == 1
    assert hass.states.get("sensor.living_duty_cycle") is not None
