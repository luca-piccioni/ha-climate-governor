"""Duty-cycle window tests for the switch valve adapter (plan item 4).

The entry is set up inside a frozen clock so the adapter's ``async_call_later``
timers and the coordinator tick run on virtual time, then advanced with
``async_fire_time_changed``. Default fixture: room 19.0 C, comfort heat
setpoint 21.0, season heating -> kp 48, tolerance 0.24 -> first output 96
-> t_on clamped to 780 s inside the 900 s window.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import timedelta

from freezegun import freeze_time
from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, callback
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.climate_governor.const import DOMAIN
from tests.conftest import base_entry_data, zone_subentry_data
from tests.fixtures import ZONE_SUBENTRY_ID, register_fake_switch

WINDOW = 900.0


@asynccontextmanager
async def frozen_loaded_entry(
    hass: HomeAssistant,
) -> AsyncIterator[tuple[MockConfigEntry, FrozenDateTimeFactory]]:
    """Load the entry with time frozen at the current virtual instant."""
    freezer = freeze_time(dt_util.utcnow())
    factory = freezer.start()
    try:
        hass.states.async_set("sensor.outdoor", "3.0", {"unit_of_measurement": "°C"})
        hass.states.async_set(
            "sensor.living_temp", "19.0", {"unit_of_measurement": "°C"}
        )
        hass.states.async_set("switch.valve", "off")
        register_fake_switch(hass, "switch.valve")
        entry = MockConfigEntry(
            domain=DOMAIN,
            unique_id=DOMAIN,
            title="Test Plant",
            version=2,
            data=base_entry_data(),
            subentries_data=[zone_subentry_data()],
        )
        entry.add_to_hass(hass)
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        # Forward setup loads the switch integration (our own switch entities),
        # which replaces the fake turn_on/turn_off handlers — re-register them.
        register_fake_switch(hass, "switch.valve")
        yield entry, factory
    finally:
        freezer.stop()


async def _advance(
    hass: HomeAssistant, factory: FrozenDateTimeFactory, seconds: float
) -> None:
    factory.tick(timedelta(seconds=seconds))
    async_fire_time_changed(hass, dt_util.utcnow())
    await hass.async_block_till_done()


async def test_valve_on_for_window_then_off(hass: HomeAssistant) -> None:
    """A cold room turns the valve on for t_on seconds, then off."""
    async with frozen_loaded_entry(hass) as (entry, factory):
        coordinator = entry.runtime_data
        act = coordinator.zones[ZONE_SUBENTRY_ID].switch_actuators[0]
        state = coordinator.zones[ZONE_SUBENTRY_ID].state

        assert hass.states.get("switch.valve").state == "on"
        assert state.duty_cycle == 86.7  # 780/900
        assert act._window_on_seconds == 780.0  # noqa: SLF001

        # Step tick by tick (60 s) through the window.
        for _ in range(12):  # t=720, still inside the ON phase
            await _advance(hass, factory, 60)
        assert hass.states.get("switch.valve").state == "on"

        await _advance(hass, factory, 120)  # t=840, past the 780 s ON time
        assert hass.states.get("switch.valve").state == "off"

        # Strictly inside the window (t=870): a tick must not restart the ON
        # phase. Asserting exactly at t=900 would race the window-end timer.
        await _advance(hass, factory, 30)  # t=870
        assert hass.states.get("switch.valve").state == "off"

        # Strictly past the window end: the next tick opens a fresh window.
        # Advance two ticks so the assertion does not depend on whether the
        # window opened at t=900 or t=960 (both leave the valve ON here).
        await _advance(hass, factory, 90)  # t=960
        await _advance(hass, factory, 60)  # t=1020, inside the new ON phase
        assert hass.states.get("switch.valve").state == "on"


async def test_zero_output_turns_valve_off_immediately(hass: HomeAssistant) -> None:
    """Reaching the setpoint cancels the pending window and turns off."""
    async with frozen_loaded_entry(hass) as (entry, factory):
        assert hass.states.get("switch.valve").state == "on"

        hass.states.async_set(
            "sensor.living_temp", "21.0", {"unit_of_measurement": "°C"}
        )
        await hass.async_block_till_done()
        await _advance(hass, factory, 60)  # next control tick

        assert hass.states.get("switch.valve").state == "off"
        coordinator = entry.runtime_data
        state = coordinator.zones[ZONE_SUBENTRY_ID].state
        assert state.output_heat == 0.0
        assert state.duty_cycle == 0.0
        assert state.in_comfort


async def test_window_survives_repeated_ticks(hass: HomeAssistant) -> None:
    """One window produces exactly one off and one on transition (no creep)."""
    transitions: list[tuple[str | None, str]] = []

    async with frozen_loaded_entry(hass) as (_entry, factory):

        @callback
        def _track(event) -> None:
            if event.data["entity_id"] != "switch.valve":
                return
            old = event.data["old_state"]
            new = event.data["new_state"]
            transitions.append(
                (old.state if old else None, new.state if new else None)
            )

        hass.bus.async_listen("state_changed", _track)

        # Tick through one full window plus the tick that opens the next one.
        for _ in range(int(WINDOW // 60) + 2):
            await _advance(hass, factory, 60)

    assert transitions == [("on", "off"), ("off", "on")]
