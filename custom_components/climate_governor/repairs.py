"""Repair issues for Climate Governor."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import (
    DOMAIN,
    ISSUE_ACTUATOR_CAPABILITY_MISMATCH,
    ISSUE_NO_OUTDOOR_SOURCE,
    ISSUE_ZONE_NO_ACTUATOR,
)


def async_setup_repairs(hass: HomeAssistant) -> None:
    """Register repair issue handlers (fix flows added in a later phase)."""


def async_check_zone_issues(
    hass: HomeAssistant, entry: ConfigEntry, runtime: object
) -> None:
    """Create or refresh repair issues for one zone runtime.

    *runtime* is a :class:`~custom_components.climate_governor.coordinator.ZoneRuntime`;
    typed loosely to avoid a circular import.
    """
    spec = runtime.spec  # type: ignore[attr-defined]
    actuators = runtime.actuators  # type: ignore[attr-defined]

    if not actuators:
        ir.async_create_issue(
            hass,
            DOMAIN,
            f"{ISSUE_ZONE_NO_ACTUATOR}_{spec.subentry_id}",
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_ZONE_NO_ACTUATOR,
            translation_placeholders={"zone": spec.name},
        )
    else:
        ir.async_delete_issue(
            hass, DOMAIN, f"{ISSUE_ZONE_NO_ACTUATOR}_{spec.subentry_id}"
        )

    mismatched = [
        a.entity_id
        for a in actuators
        if not (
            a.capabilities.supports_turn_on
            or a.capabilities.supports_heat
            or a.capabilities.supports_cool
            or a.capabilities.has_target_temperature
            or a.capabilities.has_target_temperature_range
        )
    ]
    if mismatched:
        ir.async_create_issue(
            hass,
            DOMAIN,
            f"{ISSUE_ACTUATOR_CAPABILITY_MISMATCH}_{spec.subentry_id}",
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_ACTUATOR_CAPABILITY_MISMATCH,
            translation_placeholders={
                "zone": spec.name,
                "entities": ", ".join(mismatched),
            },
        )
    else:
        ir.async_delete_issue(
            hass,
            DOMAIN,
            f"{ISSUE_ACTUATOR_CAPABILITY_MISMATCH}_{spec.subentry_id}",
        )


def async_check_outdoor_issue(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Flag when the configured outdoor source is unusable."""
    entity_id = entry.data.get("outdoor_entity_id")
    if not entity_id:
        ir.async_create_issue(
            hass,
            DOMAIN,
            ISSUE_NO_OUTDOOR_SOURCE,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_NO_OUTDOOR_SOURCE,
        )
        return
    state = hass.states.get(entity_id)
    if state is None:
        ir.async_create_issue(
            hass,
            DOMAIN,
            ISSUE_NO_OUTDOOR_SOURCE,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_NO_OUTDOOR_SOURCE,
            translation_placeholders={"entity_id": entity_id},
        )
    else:
        ir.async_delete_issue(hass, DOMAIN, ISSUE_NO_OUTDOOR_SOURCE)
