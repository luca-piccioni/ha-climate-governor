"""Capability-probing tests for the climate cascade adapter (plan item 5).

The governor must tolerate actuators that lack TARGET_TEMPERATURE (mode-only
control) or expose DRY without TARGET_HUMIDITY (never calls set_humidity).
"""

import pytest
from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ClimateEntityFeature,
    HVACMode,
)
from homeassistant.core import HomeAssistant

from custom_components.climate_governor.actuators import (
    ClimateCascadeActuator,
    create_actuator,
)
from custom_components.climate_governor.const import (
    ACTUATOR_KIND_CLIMATE,
    ACTUATOR_ROLE_COOL,
    ACTUATOR_ROLE_HEAT,
)
from tests.fixtures import register_fake_climate

ENTITY = "climate.hp"


def _adapter(
    hass: HomeAssistant, role: str = ACTUATOR_ROLE_HEAT
) -> ClimateCascadeActuator:
    act = create_actuator(hass, ENTITY, ACTUATOR_KIND_CLIMATE, role)
    assert isinstance(act, ClimateCascadeActuator)
    act.probe()
    return act


async def test_target_temperature_pushes_offset(hass: HomeAssistant) -> None:
    """With TARGET_TEMPERATURE the adapter pushes setpoint + output offset."""
    calls = register_fake_climate(
        hass, ENTITY, features=ClimateEntityFeature.TARGET_TEMPERATURE
    )
    act = _adapter(hass)
    assert act.capabilities.has_target_temperature
    assert act.capabilities.summary() == "target_temp, heat, cool"

    await act.async_apply_heat(output=50.0, setpoint=21.0)
    await hass.async_block_till_done()

    set_temp = [c for c in calls if c.service == "set_temperature"]
    assert len(set_temp) == 1
    # offset = 50/100 * 1.5 = 0.75 -> 21.75 snapped to step 0.5 -> 21.5/22.0
    assert set_temp[0].data["temperature"] in (21.5, 22.0)
    assert set_temp[0].data[ATTR_HVAC_MODE] == HVACMode.HEAT_COOL.value


async def test_no_target_temperature_never_sets_temperature(
    hass: HomeAssistant,
) -> None:
    """A mode-only actuator must never receive climate.set_temperature."""
    calls = register_fake_climate(hass, ENTITY, features=0)
    act = _adapter(hass)
    assert not act.capabilities.has_target_temperature
    assert not act.capabilities.has_target_temperature_range
    assert act.capabilities.summary() == "heat, cool"

    await act.async_apply_heat(output=80.0, setpoint=21.0)
    await act.async_apply_cool(output=40.0, setpoint=25.0)
    await hass.async_block_till_done()

    assert [c for c in calls if c.service == "set_temperature"] == []
    # Mode-only control drives hvac_mode (heat_cool supported -> single call).
    modes = [c for c in calls if c.service == "set_hvac_mode"]
    assert modes, "expected at least one set_hvac_mode call"


async def test_target_range_uses_low_high(hass: HomeAssistant) -> None:
    """With TARGET_TEMPERATURE_RANGE the adapter sends low/high bounds."""
    calls = register_fake_climate(
        hass, ENTITY, features=ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
    )
    act = _adapter(hass)
    assert act.capabilities.has_target_temperature_range

    await act.async_apply_heat(output=60.0, setpoint=21.0)
    await hass.async_block_till_done()

    set_temp = [c for c in calls if c.service == "set_temperature"]
    assert len(set_temp) == 1
    assert "target_temp_low" in set_temp[0].data
    assert "target_temp_high" in set_temp[0].data


async def test_dry_without_humidity_never_sets_humidity(
    hass: HomeAssistant,
) -> None:
    """DRY mode without TARGET_HUMIDITY must never call climate.set_humidity."""
    calls = register_fake_climate(
        hass,
        ENTITY,
        hvac_modes=("off", "heat", "cool", "dry"),
        features=ClimateEntityFeature.TARGET_TEMPERATURE,
    )
    act = _adapter(hass)
    assert act.capabilities.supports_dry
    assert not act.capabilities.has_target_humidity

    # Even a dehumidify-role apply must not touch humidity.
    await act.async_apply_cool(output=50.0, setpoint=25.0)
    await act.async_set_active(True)
    await hass.async_block_till_done()

    assert [c for c in calls if c.service == "set_humidity"] == []


async def test_mode_only_set_active_falls_back_to_mode(
    hass: HomeAssistant,
) -> None:
    """Without TURN_ON/OFF features, set_active drives hvac_mode directly."""
    calls = register_fake_climate(hass, ENTITY, features=0)
    act = _adapter(hass, role=ACTUATOR_ROLE_COOL)

    await act.async_set_active(True)
    await hass.async_block_till_done()
    assert [c for c in calls if c.service == "turn_on"] == []
    assert [c for c in calls if c.service == "set_hvac_mode"]

    await act.async_set_active(False)
    await hass.async_block_till_done()
    off = [
        c
        for c in calls
        if c.service == "set_hvac_mode"
        and c.data.get(ATTR_HVAC_MODE) == HVACMode.OFF.value
    ]
    assert off


async def test_stop_turns_off_when_supported(hass: HomeAssistant) -> None:
    """async_stop uses turn_off when the TURN_OFF feature is present."""
    calls = register_fake_climate(
        hass,
        ENTITY,
        features=ClimateEntityFeature.TARGET_TEMPERATURE
        | ClimateEntityFeature.TURN_OFF,
    )
    act = _adapter(hass)
    assert act.capabilities.supports_turn_off

    await act.async_stop()
    await hass.async_block_till_done()
    assert [c for c in calls if c.service == "turn_off"]


@pytest.mark.parametrize(
    ("role", "cooling"),
    [(ACTUATOR_ROLE_HEAT, False), (ACTUATOR_ROLE_COOL, True)],
)
async def test_probe_reads_capabilities_from_state(
    hass: HomeAssistant, role: str, cooling: bool
) -> None:
    """The adapter probes min/max/step and mode support from the entity state."""
    register_fake_climate(
        hass,
        ENTITY,
        hvac_modes=("off", "heat", "cool"),
        features=ClimateEntityFeature.TARGET_TEMPERATURE,
        min_temp=10.0,
        max_temp=30.0,
    )
    act = _adapter(hass, role=role)
    assert act.capabilities.min_temp == 10.0
    assert act.capabilities.max_temp == 30.0
    assert not act.capabilities.supports_heat_cool
    # heat_cool unsupported -> pick heat or cool by role
    assert act._pick_mode(act.capabilities, cooling) == (  # noqa: SLF001
        HVACMode.COOL.value if cooling else HVACMode.HEAT.value
    )
