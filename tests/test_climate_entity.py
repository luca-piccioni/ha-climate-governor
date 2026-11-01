"""Tests for the governor climate entity (setpoints, presets, services)."""

from dataclasses import replace

import pytest
from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_PRESET_MODE,
    ATTR_TEMPERATURE,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_PRESET_MODE,
    SERVICE_SET_TEMPERATURE,
    HVACAction,
    HVACMode,
)
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
)
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.climate_governor.const import DOMAIN
from tests.fixtures import ZONE_SUBENTRY_ID

ENTITY = "climate.living"


async def test_climate_attributes(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The entity exposes schedule setpoints and live control state."""
    state = hass.states.get(ENTITY)
    assert state is not None
    assert state.state == HVACMode.HEAT.value  # heat_cool + heating season
    assert state.attributes["hvac_action"] == HVACAction.HEATING.value
    assert state.attributes["current_temperature"] == 19.0
    assert state.attributes["temperature"] == 21.0  # comfort heat setpoint
    assert state.attributes["preset_mode"] == "comfort"
    assert set(state.attributes["preset_modes"]) == {
        "eco",
        "comfort",
        "boost",
        "away",
        "sleep",
    }
    assert set(state.attributes["hvac_modes"]) == {
        HVACMode.OFF.value,
        HVACMode.HEAT.value,
        HVACMode.COOL.value,
        HVACMode.HEAT_COOL.value,
    }


async def test_set_hvac_mode_updates_user_config(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Selecting a mode writes through to the zone user config."""
    await hass.services.async_call(
        CLIMATE_DOMAIN,
        SERVICE_SET_HVAC_MODE,
        {ATTR_ENTITY_ID: ENTITY, ATTR_HVAC_MODE: HVACMode.OFF.value},
        blocking=True,
    )
    coordinator = loaded_entry.runtime_data
    assert coordinator.zones[ZONE_SUBENTRY_ID].user.hvac_mode == HVACMode.OFF.value
    assert hass.states.get(ENTITY).state == HVACMode.OFF.value


async def test_set_temperature_accumulates_offset(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Setting a temperature shifts the zone setpoint via an offset delta."""
    await hass.services.async_call(
        CLIMATE_DOMAIN,
        SERVICE_SET_TEMPERATURE,
        {ATTR_ENTITY_ID: ENTITY, ATTR_TEMPERATURE: 22.0},
        blocking=True,
    )
    coordinator = loaded_entry.runtime_data
    runtime = coordinator.zones[ZONE_SUBENTRY_ID]
    assert runtime.user.setpoint_offset == pytest.approx(1.0)
    # The published target moved with the offset.
    assert hass.states.get(ENTITY).attributes["temperature"] == 22.0


async def test_set_preset_mode_holds_preset(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Choosing a preset holds it over the schedule."""
    await hass.services.async_call(
        CLIMATE_DOMAIN,
        SERVICE_SET_PRESET_MODE,
        {ATTR_ENTITY_ID: ENTITY, ATTR_PRESET_MODE: "eco"},
        blocking=True,
    )
    coordinator = loaded_entry.runtime_data
    assert coordinator.zones[ZONE_SUBENTRY_ID].user.preset == "eco"
    state = hass.states.get(ENTITY)
    assert state.attributes["preset_mode"] == "eco"
    assert state.attributes["temperature"] == 18.0  # eco heat setpoint


async def test_reset_integral_service(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The integration service clears the zone integral."""
    coordinator = loaded_entry.runtime_data
    runtime = coordinator.zones[ZONE_SUBENTRY_ID]
    # Seed a non-zero integral (the first control step has dt=0).
    runtime.control_state = replace(runtime.control_state, integral=1.25)

    await hass.services.async_call(
        DOMAIN,
        "reset_integral",
        {ATTR_ENTITY_ID: ENTITY},
        blocking=True,
    )
    assert runtime.control_state.integral == 0.0


async def test_set_hold_service(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The set_hold service pins a preset (or releases with schedule)."""
    await hass.services.async_call(
        DOMAIN,
        "set_hold",
        {ATTR_ENTITY_ID: ENTITY, "preset": "boost"},
        blocking=True,
    )
    coordinator = loaded_entry.runtime_data
    assert coordinator.zones[ZONE_SUBENTRY_ID].user.preset == "boost"

    await hass.services.async_call(
        DOMAIN,
        "set_hold",
        {ATTR_ENTITY_ID: ENTITY, "preset": "schedule"},
        blocking=True,
    )
    assert coordinator.zones[ZONE_SUBENTRY_ID].user.preset is None
