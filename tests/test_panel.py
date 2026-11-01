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

    assert payload["gateway_entities"]["outdoor_temperature"] == (
        "sensor.test_plant_outdoor_temperature"
    )


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
