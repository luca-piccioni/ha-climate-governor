"""Diagnostics for Climate Governor."""

from typing import Any

from homeassistant.core import HomeAssistant

from .const import (
    SUBENTRY_TYPE_PERIOD,
    SUBENTRY_TYPE_ZONE,
)
from .coordinator import ClimateGovernorConfigEntry


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ClimateGovernorConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator = entry.runtime_data
    zones: dict[str, Any] = {}
    for zone_id, runtime in coordinator.zones.items():
        state = runtime.state
        zones[zone_id] = {
            "name": runtime.spec.name,
            "temperature_sensors": list(runtime.spec.temperature_sensors),
            "actuators": [
                {
                    "entity_id": a.entity_id,
                    "kind": a.kind,
                    "role": a.role,
                    "capabilities": a.capabilities.summary(),
                }
                for a in runtime.actuators
            ],
            "user_config": {
                "enabled": runtime.user.enabled,
                "boost": runtime.user.boost,
                "hvac_mode": runtime.user.hvac_mode,
                "preset_hold": runtime.user.preset,
                "setpoint_offset": runtime.user.setpoint_offset,
            },
            "state": {
                "hvac_mode": state.hvac_mode,
                "action": state.action,
                "current_temp": state.current_temp,
                "target_temp_low": state.target_temp_low,
                "target_temp_high": state.target_temp_high,
                "output_heat": round(state.output_heat, 1),
                "output_cool": round(state.output_cool, 1),
                "duty_cycle": state.duty_cycle,
                "integral": round(state.integral, 3),
                "schedule_preset": state.schedule_preset,
                "effective_preset": state.effective_preset,
                "blocked": state.blocked,
                "in_comfort": state.in_comfort,
            },
        }

    return {
        "config": {
            "name": coordinator.config.name,
            "outdoor_entity_id": coordinator.config.outdoor_entity_id,
            "outdoor_design_temp": coordinator.config.outdoor_design_temp,
            "stale_after": coordinator.config.stale_after,
        },
        "options": {
            "presets": coordinator.options.presets,
            "season": coordinator.options.season,
            "default_preset": coordinator.options.default_preset,
            "tolerance": coordinator.options.tolerance,
            "kp": coordinator.options.kp,
            "ki": coordinator.options.ki,
            "cycle_window": coordinator.options.cycle_window,
        },
        "outdoor_temp": coordinator.data.outdoor_temp if coordinator.data else None,
        "master_heat": coordinator.master_heat,
        "master_cool": coordinator.master_cool,
        "subentries": {
            SUBENTRY_TYPE_ZONE: [
                {"subentry_id": s.subentry_id, "title": s.title}
                for s in entry.get_subentries_of_type(SUBENTRY_TYPE_ZONE)
            ],
            SUBENTRY_TYPE_PERIOD: [
                {"subentry_id": s.subentry_id, "title": s.title}
                for s in entry.get_subentries_of_type(SUBENTRY_TYPE_PERIOD)
            ],
        },
        "zones": zones,
    }
