"""Tests for entry setup, entity creation and lifecycle."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import STATE_ON, STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.climate_governor.const import DOMAIN
from tests.conftest import base_entry_data, zone_subentry_data


async def test_entry_setup_creates_entities(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Setup creates the climate entity and the tuning/diagnostic entities."""
    assert loaded_entry.state is ConfigEntryState.LOADED

    # One climate entity per zone subentry.
    climate = hass.states.get("climate.living")
    assert climate is not None
    assert climate.attributes.get("hvac_modes")

    # Diagnostic + config entities exist.
    assert hass.states.get("sensor.living_duty_cycle") is not None
    assert hass.states.get("sensor.living_control_output") is not None
    assert hass.states.get("sensor.living_actuator_capabilities") is not None
    assert hass.states.get("number.living_deadband_tolerance") is not None
    assert hass.states.get("switch.living_enabled") is not None
    assert hass.states.get("binary_sensor.living_actuator_active") is not None
    assert hass.states.get("button.living_reset_integral") is not None
    assert hass.states.get("sensor.test_plant_outdoor_temperature") is not None
    assert hass.states.get("select.test_plant_season") is not None


async def test_climate_entity_state(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The climate entity reflects the coordinator state."""
    climate = hass.states.get("climate.living")
    assert climate is not None
    assert climate.state in ("heat", "cool", "heat_cool", "off")
    assert climate.attributes.get("current_temperature") == 19.0
    assert climate.attributes.get("temperature") is not None


async def test_entry_unload_removes_entities(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Unloading removes all entities."""
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert loaded_entry.state is ConfigEntryState.NOT_LOADED

    # After unload, entities stay in the registry but their states are marked
    # unavailable (HA keeps restored/unavailable states for registry entries
    # until the config entry itself is deleted).
    duty = hass.states.get("sensor.living_duty_cycle")
    assert duty is not None
    assert duty.state == STATE_UNAVAILABLE
    assert hass.states.get("climate.living").state == STATE_UNAVAILABLE


async def test_migrate_v1_entry(
    hass: HomeAssistant, enable_custom_integrations
) -> None:
    """A v1 empty-data entry is migrated to v2 with defaults."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=1,
        data={},
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.version == 2
    assert entry.data["name"] == "Climate Governor"


async def test_setup_without_zone_raises(
    hass: HomeAssistant, enable_custom_integrations
) -> None:
    """An entry with no zone subentry fails setup with a translation error."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=2,
        data=base_entry_data(),
        subentries_data=[],
    )
    entry.add_to_hass(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state in (
        ConfigEntryState.SETUP_RETRY,
        ConfigEntryState.SETUP_ERROR,
    )


async def test_duty_cycle_valve_turns_on(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """A cold room drives the valve switch on."""
    # Default preset comfort heat = 21.0, current 19.0 -> error 2.0 -> output > 0.
    await loaded_entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    assert hass.states.is_state("switch.valve", STATE_ON)

    state = hass.states.get("sensor.living_duty_cycle")
    assert state is not None
    assert float(state.state) > 0
