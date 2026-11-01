"""Tests for the Climate Governor config flow."""


from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.climate_governor.const import (
    CONF_ACTUATOR_ENTITY_ID,
    CONF_ACTUATOR_KIND,
    CONF_ACTUATOR_ROLE,
    CONF_ACTUATORS,
    CONF_NAME,
    CONF_OUTDOOR_DESIGN_TEMP,
    CONF_OUTDOOR_ENTITY_ID,
    CONF_ZONE_NAME,
    DOMAIN,
    SUBENTRY_TYPE_ZONE,
)
from tests.conftest import base_entry_data, zone_subentry_data

USER_INPUT = {
    CONF_NAME: "My Plant",
    CONF_OUTDOOR_ENTITY_ID: "sensor.outdoor",
    CONF_OUTDOOR_DESIGN_TEMP: -7.0,
}
ZONE_INPUT = {
    CONF_ZONE_NAME: "Living",
    "temperature_sensors": ["sensor.living_temp"],
    "heat_switch": "switch.valve",
    "aggregation": "mean",
}


async def test_user_flow_creates_entry_with_first_zone(
    hass, enable_custom_integrations
):
    """The user flow creates an entry with a first zone subentry."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input=USER_INPUT
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "zone"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input=ZONE_INPUT
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "My Plant"
    assert result["data"][CONF_NAME] == "My Plant"
    assert result["data"][CONF_OUTDOOR_ENTITY_ID] == "sensor.outdoor"

    assert len(result["subentries"]) == 1
    subentry = result["subentries"][0]
    assert subentry["subentry_type"] == SUBENTRY_TYPE_ZONE
    assert subentry["title"] == "Living"
    assert subentry["data"][CONF_ACTUATORS] == [
        {
            CONF_ACTUATOR_ENTITY_ID: "switch.valve",
            CONF_ACTUATOR_KIND: "switch",
            CONF_ACTUATOR_ROLE: "heat",
        }
    ]


async def test_user_flow_zone_requires_sensors(hass, enable_custom_integrations):
    """The zone step errors when no temperature sensor is selected."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input=USER_INPUT
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={**ZONE_INPUT, "temperature_sensors": []},
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"temperature_sensors": "no_sensors"}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input=ZONE_INPUT
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY


async def test_user_flow_zone_requires_actuator(hass, enable_custom_integrations):
    """The zone step errors when no actuator is selected."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input=USER_INPUT
    )
    no_actuator = {k: v for k, v in ZONE_INPUT.items() if k != "heat_switch"}
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input=no_actuator
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"heat_switch": "no_actuator"}


async def test_single_instance(hass, enable_custom_integrations):
    """Only one config entry is allowed."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=2,
        data=base_entry_data(),
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_reconfigure_flow(hass, enable_custom_integrations):
    """The entry can be reconfigured."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=2,
        title="Test Plant",
        data=base_entry_data(),
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)

    result = await entry.start_reconfigure_flow(hass)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "reconfigure"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={**USER_INPUT, CONF_NAME: "Renamed"},
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert entry.data[CONF_NAME] == "Renamed"


async def test_options_flow_presets(hass, enable_custom_integrations):
    """The options flow edits preset setpoints."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=2,
        title="Test Plant",
        data=base_entry_data(),
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.MENU
    assert "presets" in result["menu_options"]

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], user_input={"next_step_id": "presets"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "presets"

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        user_input={"comfort_heat": 22.5, "default_preset": "eco"},
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert entry.options["presets"]["comfort"]["heat"] == 22.5
    assert entry.options["default_preset"] == "eco"


async def test_options_flow_season(hass, enable_custom_integrations):
    """The options flow sets the season."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=2,
        title="Test Plant",
        data=base_entry_data(),
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], user_input={"next_step_id": "season"}
    )
    assert result["step_id"] == "season"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], user_input={"season": "cooling"}
    )
    assert result["type"] is FlowResultType.ABORT
    assert entry.options["season"] == "cooling"


async def test_add_zone_subentry_flow(hass, enable_custom_integrations):
    """A zone subentry can be added after setup."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=2,
        title="Test Plant",
        data=base_entry_data(),
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, SUBENTRY_TYPE_ZONE), context={"source": "user"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        user_input={
            CONF_ZONE_NAME: "Bedroom",
            "temperature_sensors": ["sensor.bedroom_temp"],
            "heat_climate": "climate.bedroom_ac",
            "aggregation": "median",
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Bedroom"

    zones = entry.get_subentries_of_type(SUBENTRY_TYPE_ZONE)
    assert len(zones) == 2
    bedroom = next(z for z in zones if z.title == "Bedroom")
    actuator = bedroom.data[CONF_ACTUATORS][0]
    assert actuator[CONF_ACTUATOR_ENTITY_ID] == "climate.bedroom_ac"


async def test_reconfigure_zone_subentry_flow(hass, enable_custom_integrations):
    """A zone subentry can be reconfigured."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        version=2,
        title="Test Plant",
        data=base_entry_data(),
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)

    result = await entry.start_subentry_reconfigure_flow(hass, "zone-living")
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "reconfigure"
    # Suggested values come from the stored subentry.
    assert result["data_schema"] is not None

    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        user_input={
            CONF_ZONE_NAME: "Living Room",
            "temperature_sensors": ["sensor.living_temp", "sensor.living_temp2"],
            "heat_switch": "switch.valve",
            "cool_climate": "climate.ac",
            "aggregation": "mean",
        },
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"

    zone = entry.subentries["zone-living"]
    assert zone.title == "Living Room"
    assert len(zone.data["temperature_sensors"]) == 2
    assert len(zone.data[CONF_ACTUATORS]) == 2
