"""Diagnostics snapshot test (plan checklist item 8)."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from syrupy.assertion import SnapshotAssertion

from custom_components.climate_governor.const import DOMAIN
from custom_components.climate_governor.diagnostics import (
    async_get_config_entry_diagnostics,
)
from tests.conftest import base_entry_data, period_subentry_data, zone_subentry_data
from tests.fixtures import register_fake_switch


async def test_diagnostics_snapshot(
    hass: HomeAssistant, snapshot: SnapshotAssertion
) -> None:
    """The diagnostics payload matches the committed snapshot."""
    hass.states.async_set("sensor.outdoor", "3.0", {"unit_of_measurement": "°C"})
    hass.states.async_set("sensor.living_temp", "19.0", {"unit_of_measurement": "°C"})
    hass.states.async_set("switch.valve", "off")
    register_fake_switch(hass, "switch.valve")

    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        title="Test Plant",
        version=2,
        entry_id="01FIXEDENTRYID0000000000000",
        data=base_entry_data(),
        subentries_data=[zone_subentry_data(), period_subentry_data()],
    )
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.LOADED

    diagnostics = await async_get_config_entry_diagnostics(hass, entry)
    assert diagnostics == snapshot
