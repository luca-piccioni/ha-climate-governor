"""Tests for the configuration panel registration and overview command."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.climate_governor.const import DOMAIN
from custom_components.climate_governor.panel import (
    PANEL_URL_PATH,
    WEBCOMPONENT_NAME,
)


async def test_panel_registered(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Setting up the integration registers the config panel once."""
    assert loaded_entry.state is ConfigEntryState.LOADED

    panels = hass.data["frontend_panels"]
    panel = panels[PANEL_URL_PATH]
    assert panel.config_panel_domain == DOMAIN
    assert panel.require_admin
    assert panel.config["_panel_custom"]["name"] == WEBCOMPONENT_NAME
    assert panel.config["_panel_custom"]["module_url"].startswith(
        "/climate_governor_static/entrypoint-"
    )


async def test_panel_registration_is_idempotent(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Reloading the entry does not re-register (or duplicate) the panel."""
    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert loaded_entry.state is ConfigEntryState.LOADED

    panels = hass.data["frontend_panels"]
    assert PANEL_URL_PATH in panels
    # Guard flag set once per run.
    assert hass.data[DOMAIN]["panel_registered"] is True


async def test_overview_command(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """The overview command returns entry, zones, entities and live state."""
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "climate_governor/overview"})
    response = await client.receive_json()

    assert response["type"] == "result"
    assert response["success"] is True
    payload = response["result"]

    assert payload["entry"]["entry_id"] == loaded_entry.entry_id
    assert payload["entry"]["title"] == "Test Plant"
    assert payload["temperature_unit"] == "°C"

    assert len(payload["zones"]) == 1
    zone = payload["zones"][0]
    assert zone["name"] == "Living"
    # Live state present and mapped entities resolved from the registry.
    assert zone["state"] is not None
    assert zone["state"]["current_temp"] == 19.0
    assert zone["entities"]["climate"] == "climate.living"
    assert zone["entities"]["duty_cycle"] == "sensor.living_duty_cycle"
    # CONFIG-category entities used by the panel's inline controls. The
    # zone_enable switch's unique_id suffix is "-enable" (not "-zone_enable").
    assert zone["entities"]["zone_enable"] == "switch.living_enabled"
    assert zone["entities"]["reset_integral"] == "button.living_reset_integral"
    assert zone["entities"]["preset_hold"] == "select.living_preset_hold"

    assert payload["gateway_entities"]["outdoor_temperature"] == (
        "sensor.test_plant_outdoor_temperature"
    )


async def test_overview_includes_limits_and_tuning(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """The overview carries the numeric bounds + effective tuning the panel edits."""
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "climate_governor/overview"})
    response = await client.receive_json()
    payload = response["result"]

    # Static bounds mirror const.py so the panel enforces what the flow accepts.
    assert payload["preset_keys"]
    assert payload["limits"]["preset_heat"] == [5.0, 40.0, 0.5, "°C"]
    assert payload["limits"]["tuning"]["kp"] == [0.0, 200.0, 1.0, None]
    assert payload["season_options"] == ["heating", "shoulder", "cooling"]

    # Effective global tuning values (from parsed options/defaults).
    assert payload["tuning"]["kp"] == 40.0
    assert payload["tuning"]["tolerance"] == 0.3

    # Effective presets/season/default (parsed + defaulted), not the raw
    # entry.options which omits unset keys.
    assert payload["presets"]["comfort"]["heat"] == 21.0
    assert payload["season"] == "heating"
    assert payload["default_preset"] == "comfort"


async def test_update_options_command(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """The update_options command writes presets/season/tuning, clamping bounds."""
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {
            "type": "climate_governor/update_options",
            "entry_id": loaded_entry.entry_id,
            "presets": {
                "comfort": {"heat": 22.0, "cool": 26.0},
                # Out-of-range heat must clamp to the max (40.0).
                "boost": {"heat": 100.0},
            },
            "default_preset": "eco",
            "season": "cooling",
            # cycle_window coerces to int; tolerance clamps to max (3.0).
            "tuning": {"kp": 50.0, "cycle_window": 1200.0, "tolerance": 10.0},
        }
    )
    response = await client.receive_json()
    assert response["success"] is True
    options = response["result"]["options"]

    assert options["presets"]["comfort"] == {"heat": 22.0, "cool": 26.0}
    assert options["presets"]["boost"]["heat"] == 40.0
    assert options["default_preset"] == "eco"
    assert options["season"] == "cooling"
    assert options["kp"] == 50.0
    assert options["cycle_window"] == 1200
    assert isinstance(options["cycle_window"], int)
    assert options["tolerance"] == 3.0

    # The update listener reloads the entry; options persist on the entry.
    await hass.async_block_till_done()
    assert loaded_entry.options["presets"]["comfort"]["heat"] == 22.0
    assert loaded_entry.state is not None


async def test_update_options_command_unknown_entry(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """An unknown entry id is rejected."""
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {
            "type": "climate_governor/update_options",
            "entry_id": "does-not-exist",
            "season": "cooling",
        }
    )
    response = await client.receive_json()
    assert response["success"] is False
    assert response["error"]["code"] == "not_found"


async def test_diagnostics_command(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """The diagnostics command returns the entry diagnostics plus open issues."""
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "climate_governor/diagnostics"})
    response = await client.receive_json()
    assert response["success"] is True
    result = response["result"]

    assert isinstance(result["issues"], list)
    diag = result["diagnostics"]
    assert diag is not None
    assert diag["config"]["name"] == "Test Plant"
    assert "Living" in {z["name"] for z in diag["zones"].values()}


async def test_diagnostics_command_no_entry(
    hass: HomeAssistant,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """With no entry the diagnostics command returns null diagnostics."""
    assert await async_setup_component(hass, DOMAIN, {})
    await hass.async_block_till_done()

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "climate_governor/diagnostics"})
    response = await client.receive_json()
    assert response["success"] is True
    assert response["result"]["diagnostics"] is None
    assert response["result"]["issues"] == []


async def test_overview_command_no_entry(
    hass: HomeAssistant,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """With no config entry the command returns entry=None."""
    # Set up the integration (registers the WS command) without any entry.
    assert await async_setup_component(hass, DOMAIN, {})
    await hass.async_block_till_done()

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "climate_governor/overview"})
    response = await client.receive_json()

    assert response["success"] is True
    assert response["result"]["entry"] is None
