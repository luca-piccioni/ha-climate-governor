"""Shared fixtures for Climate Governor tests."""

from collections.abc import AsyncGenerator

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.climate_governor.const import (
    ACTUATOR_KIND_SWITCH,
    ACTUATOR_ROLE_HEAT,
    CONF_ACTUATOR_ENTITY_ID,
    CONF_ACTUATOR_KIND,
    CONF_ACTUATOR_ROLE,
    CONF_NAME,
    CONF_OUTDOOR_DESIGN_TEMP,
    CONF_OUTDOOR_ENTITY_ID,
    DEFAULT_OUTDOOR_DESIGN_TEMP,
    DOMAIN,
    SUBENTRY_TYPE_PERIOD,
)
from custom_components.climate_governor.coordinator import GovernorCoordinator
from tests.fixtures import ZONE_SUBENTRY_ID, make_zone_subentry_data


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable loading of custom integrations in every test."""
    yield


def base_entry_data(**overrides) -> dict:
    """System config data for a mock entry."""
    data = {
        CONF_NAME: "Test Plant",
        CONF_OUTDOOR_ENTITY_ID: "sensor.outdoor",
        CONF_OUTDOOR_DESIGN_TEMP: DEFAULT_OUTDOOR_DESIGN_TEMP,
    }
    data.update(overrides)
    return data


def zone_subentry_data(
    *,
    zone_id: str = ZONE_SUBENTRY_ID,
    name: str = "Living",
    sensors: tuple[str, ...] = ("sensor.living_temp",),
    actuators: tuple[dict, ...] = (
        {
            CONF_ACTUATOR_ENTITY_ID: "switch.valve",
            CONF_ACTUATOR_KIND: ACTUATOR_KIND_SWITCH,
            CONF_ACTUATOR_ROLE: ACTUATOR_ROLE_HEAT,
        },
    ),
    **overrides,
) -> dict:
    """One zone subentry in MockConfigEntry storage format."""
    return make_zone_subentry_data(
        zone_id=zone_id,
        name=name,
        sensors=sensors,
        actuators=actuators,
        **overrides,
    )


def period_subentry_data(
    *,
    period_id: str = "period-morning",
    zones: tuple[str, ...] = (ZONE_SUBENTRY_ID,),
    days: tuple[int, ...] = (0, 1, 2, 3, 4),
    from_time: str = "06:30",
    to_time: str = "08:30",
    preset: str = "comfort",
) -> dict:
    """One period subentry in MockConfigEntry storage format."""
    return {
        "subentry_id": period_id,
        "subentry_type": SUBENTRY_TYPE_PERIOD,
        "title": f"Weekdays {from_time}-{to_time} {preset}",
        "unique_id": None,
        "data": {
            "zones": list(zones),
            "days": list(days),
            "from_time": from_time,
            "to_time": to_time,
            "preset": preset,
        },
    }


@pytest.fixture
def mock_entry() -> MockConfigEntry:
    """A ready-to-load entry with one zone subentry (switch valve)."""
    return MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        title="Test Plant",
        version=2,
        data=base_entry_data(),
        subentries_data=[zone_subentry_data()],
    )


@pytest.fixture
async def loaded_entry(
    hass: HomeAssistant, mock_entry: MockConfigEntry
) -> AsyncGenerator[MockConfigEntry]:
    """Entry loaded with fake sensor/switch states and services already present."""
    from tests.fixtures import register_fake_switch

    hass.states.async_set("sensor.outdoor", "3.0", {"unit_of_measurement": "°C"})
    hass.states.async_set("sensor.living_temp", "19.0", {"unit_of_measurement": "°C"})
    hass.states.async_set("switch.valve", "off")
    register_fake_switch(hass, "switch.valve")
    mock_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_entry.entry_id)
    await hass.async_block_till_done()
    # Forward setup loads the switch integration (our own switch entities),
    # which replaces the fake turn_on/turn_off handlers — re-register them.
    register_fake_switch(hass, "switch.valve")
    yield mock_entry


@pytest.fixture
def coordinator(loaded_entry: MockConfigEntry) -> GovernorCoordinator:
    """The runtime coordinator of the loaded entry."""
    return loaded_entry.runtime_data
