"""Repair-issue tests (plan item 15)."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.climate_governor.const import (
    ACTUATOR_KIND_CLIMATE,
    ACTUATOR_ROLE_HEAT,
    DOMAIN,
    ISSUE_ACTUATOR_CAPABILITY_MISMATCH,
    ISSUE_NO_OUTDOOR_SOURCE,
    ISSUE_ZONE_NO_ACTUATOR,
)
from custom_components.climate_governor.repairs import (
    async_check_outdoor_issue,
)
from tests.conftest import base_entry_data, zone_subentry_data
from tests.fixtures import register_fake_climate


async def test_zone_no_actuator_issue(hass: HomeAssistant) -> None:
    """A zone without actuators raises a zone_no_actuator repair issue."""
    hass.states.async_set("sensor.outdoor", "3.0", {"unit_of_measurement": "°C"})
    hass.states.async_set("sensor.living_temp", "19.0", {"unit_of_measurement": "°C"})
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        title="Test Plant",
        version=2,
        data=base_entry_data(),
        subentries_data=[zone_subentry_data(actuators=())],
    )
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.LOADED

    issue = ir.async_get(hass).async_get_issue(
        DOMAIN, f"{ISSUE_ZONE_NO_ACTUATOR}_zone-living"
    )
    assert issue is not None
    assert issue.translation_key == ISSUE_ZONE_NO_ACTUATOR
    assert issue.severity == ir.IssueSeverity.WARNING


async def test_capability_mismatch_issue(hass: HomeAssistant) -> None:
    """An actuator with no usable capability raises a mismatch issue."""
    # A climate actuator with no features and no heat/cool modes is unusable.
    register_fake_climate(hass, "climate.hp", hvac_modes=("off",), features=0)
    hass.states.async_set("sensor.outdoor", "3.0", {"unit_of_measurement": "°C"})
    hass.states.async_set("sensor.living_temp", "19.0", {"unit_of_measurement": "°C"})
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        title="Test Plant",
        version=2,
        data=base_entry_data(),
        subentries_data=[
            zone_subentry_data(
                actuators=(
                    {
                        "entity_id": "climate.hp",
                        "kind": ACTUATOR_KIND_CLIMATE,
                        "role": ACTUATOR_ROLE_HEAT,
                    },
                )
            )
        ],
    )
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    issue = ir.async_get(hass).async_get_issue(
        DOMAIN, f"{ISSUE_ACTUATOR_CAPABILITY_MISMATCH}_zone-living"
    )
    assert issue is not None
    assert "climate.hp" in issue.translation_placeholders["entities"]


async def test_healthy_zone_has_no_issues(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """A well-configured zone produces no repair issues."""
    registry = ir.async_get(hass)
    zone_issues = [
        issue_id
        for (domain, issue_id) in registry.issues
        if domain == DOMAIN
        and issue_id.startswith(
            (ISSUE_ZONE_NO_ACTUATOR, ISSUE_ACTUATOR_CAPABILITY_MISMATCH)
        )
    ]
    assert zone_issues == []


async def test_outdoor_issue_created_and_cleared(hass: HomeAssistant) -> None:
    """async_check_outdoor_issue creates an issue when the source is missing."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id=DOMAIN,
        title="Test Plant",
        version=2,
        data=base_entry_data(outdoor_entity_id="sensor.missing"),
        subentries_data=[zone_subentry_data()],
    )
    entry.add_to_hass(hass)

    async_check_outdoor_issue(hass, entry)
    issue = ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_NO_OUTDOOR_SOURCE)
    assert issue is not None

    hass.states.async_set("sensor.missing", "5.0", {"unit_of_measurement": "°C"})
    async_check_outdoor_issue(hass, entry)
    assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_NO_OUTDOOR_SOURCE) is None
