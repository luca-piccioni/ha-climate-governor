"""Climate Governor configuration panel (Tier C presentation layer).

Registers a single custom panel (``/climate-governor``) that renders over the
existing config-entry + subentry model, and a ``climate_governor/overview``
websocket command that returns the whole plant (entry, subentries, live zone
state, entity map, areas/floors) in one round-trip so the frontend does not
have to stitch many subscriptions together.

The panel is registered once per HA run (guarded in ``hass.data``) from
``async_setup``; entry reloads do not re-register it. Static assets are served
from ``frontend/dist`` with a build-id filename for cache busting.
"""

from __future__ import annotations

import glob
import logging
import os
from typing import Any

import probatio
from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import floor_registry as fr

from .const import (
    CONF_ACTUATOR_ENTITY_ID,
    CONF_ACTUATOR_KIND,
    CONF_ACTUATOR_ROLE,
    CONF_AREA_ID,
    CONF_DAYS,
    CONF_DEFAULT_PRESET,
    CONF_FLOOR_ID,
    CONF_FROM_TIME,
    CONF_HUMIDITY_SENSOR,
    CONF_MASTER_COOL,
    CONF_MASTER_HEAT,
    CONF_OUTDOOR_ENTITY_ID,
    CONF_PRESET,
    CONF_PRESETS,
    CONF_SEASON,
    CONF_TEMPERATURE_SENSORS,
    CONF_TO_TIME,
    DOMAIN,
    SUBENTRY_TYPE_PERIOD,
    SUBENTRY_TYPE_ZONE,
)
from .coordinator import GovernorCoordinator

_LOGGER = logging.getLogger(__name__)

URL_BASE = "/climate_governor_static"
PANEL_URL_PATH = "climate-governor"
WEBCOMPONENT_NAME = "climate-governor-panel"
DIST_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")

# entity role -> the unique_id suffix used by the platform that owns it.
# (climate entity unique_id is exactly the zone prefix, so its suffix is "")
_ZONE_ENTITY_KEYS = {
    "climate": "",
    "duty_cycle": "duty_cycle",
    "control_output": "control_output",
    "integral": "integral",
    "next_schedule_change": "next_schedule_change",
    "actuator_capabilities": "actuator_capabilities",
    "actuator_active": "actuator_active",
    "blocked": "blocked",
    "in_comfort": "in_comfort",
    "tolerance": "tolerance",
    "kp": "kp",
    "ki": "ki",
    "setpoint_offset": "setpoint_offset",
    "preset_hold": "preset_hold",
    "zone_enable": "enable",
    "boost": "boost",
    "reset_integral": "reset_integral",
}
_GATEWAY_ENTITY_KEYS = {
    "outdoor_temperature": "outdoor-temp",
    "season": "season",
    "master_heat": CONF_MASTER_HEAT,
    "master_cool": CONF_MASTER_COOL,
}


def _scan_dist() -> tuple[str, str] | None:
    """Return (build_id, entrypoint_filename), or None if dist is missing.

    Runs in an executor: touching the filesystem here would block the loop.
    Production builds emit ``entrypoint-<id>.js``; a dev build (or none) falls
    back to ``entrypoint.js`` with build id ``dev`` (disables cache headers).
    """
    if not os.path.isdir(DIST_DIR):
        return None
    matches = sorted(glob.glob(os.path.join(DIST_DIR, "entrypoint-*.js")))
    if matches:
        name = os.path.basename(matches[-1])
        build_id = name[len("entrypoint-") : -len(".js")]
        return build_id, name
    return "dev", "entrypoint.js"


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Register the static path and the panel once per HA run."""
    if hass.data.get(DOMAIN, {}).get("panel_registered"):
        return

    websocket_api.async_register_command(hass, overview_command)

    dist = await hass.async_add_executor_job(_scan_dist)
    if dist is None:
        _LOGGER.warning(
            "Climate Governor panel assets missing in %s; run `npm run build` "
            "in the frontend folder",
            DIST_DIR,
        )
        return

    build_id, entrypoint = dist
    await hass.http.async_register_static_paths(
        [StaticPathConfig(URL_BASE, DIST_DIR, cache_headers=(build_id != "dev"))]
    )
    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=PANEL_URL_PATH,
        config_panel_domain=DOMAIN,
        webcomponent_name=WEBCOMPONENT_NAME,
        module_url=f"{URL_BASE}/{entrypoint}",
        sidebar_title="Climate Governor",
        sidebar_icon="mdi:thermostat",
        require_admin=True,
    )
    hass.data.setdefault(DOMAIN, {})["panel_registered"] = True
    _LOGGER.debug("Climate Governor panel registered: %s/%s", URL_BASE, entrypoint)


def _entity_map(
    hass: HomeAssistant, entry: ConfigEntry
) -> tuple[dict[str, dict[str, str]], dict[str, str]]:
    """Map entity ids to roles, per zone subentry and for the gateway device.

    Uses the entity registry ``config_subentry_id`` (zone) and the unique_id
    suffix (role), so the panel never guesses entity ids from names.
    """
    ent_reg = er.async_get(hass)
    zone_entities: dict[str, dict[str, str]] = {}
    gateway_entities: dict[str, str] = {}
    zone_prefix = f"{entry.entry_id}-zone-"

    for ent in ent_reg.entities.values():
        if ent.config_entry_id != entry.entry_id:
            continue
        uid = ent.unique_id or ""
        if ent.config_subentry_id:
            sub = ent.config_subentry_id
            if not uid.startswith(zone_prefix + sub):
                continue
            suffix = uid[len(zone_prefix + sub) :].lstrip("-")
            role = next(
                (r for r, k in _ZONE_ENTITY_KEYS.items() if k == suffix), None
            )
            if role:
                zone_entities.setdefault(sub, {})[role] = ent.entity_id
        elif uid.startswith(f"{entry.entry_id}-"):
            suffix = uid[len(f"{entry.entry_id}-") :]
            role = next(
                (r for r, k in _GATEWAY_ENTITY_KEYS.items() if k == suffix), None
            )
            if role:
                gateway_entities[role] = ent.entity_id
    return zone_entities, gateway_entities


def _zone_payload(
    coordinator: GovernorCoordinator,
    zone_entities: dict[str, str],
    subentry_id: str,
) -> dict[str, Any]:
    runtime = coordinator.zones[subentry_id]
    spec = runtime.spec
    state = runtime.state
    return {
        "subentry_id": subentry_id,
        "title": spec.title,
        "name": spec.name,
        "area_id": spec.area_id,
        "floor_id": spec.floor_id,
        "temperature_sensors": list(spec.temperature_sensors),
        "humidity_sensor": spec.humidity_sensor,
        "actuators": [
            {
                CONF_ACTUATOR_ENTITY_ID: a.entity_id,
                CONF_ACTUATOR_KIND: a.kind,
                CONF_ACTUATOR_ROLE: a.role,
            }
            for a in spec.actuators
        ],
        "aggregation": spec.aggregation,
        "control_overrides": spec.control_overrides,
        "entities": zone_entities,
        "state": {
            "hvac_mode": state.hvac_mode,
            "action": state.action,
            "target_temp": state.target_temp,
            "target_temp_low": state.target_temp_low,
            "target_temp_high": state.target_temp_high,
            "current_temp": state.current_temp,
            "humidity": state.humidity,
            "output_heat": state.output_heat,
            "output_cool": state.output_cool,
            "duty_cycle": state.duty_cycle,
            "integral": state.integral,
            "schedule_preset": state.schedule_preset,
            "effective_preset": state.effective_preset,
            "next_change": state.next_change.isoformat() if state.next_change else None,
            "active": state.active,
            "blocked": state.blocked,
            "in_comfort": state.in_comfort,
            "capabilities": state.capabilities,
            "outdoor_temp": state.outdoor_temp,
        },
    }


@websocket_api.websocket_command(
    {probatio.Required("type"): "climate_governor/overview"}
)
@websocket_api.require_admin
@websocket_api.async_response
async def overview_command(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Return the whole plant summary for the panel."""
    entry = next(iter(hass.config_entries.async_entries(DOMAIN)), None)
    if entry is None:
        connection.send_result(msg["id"], {"entry": None})
        return

    coordinator = getattr(entry, "runtime_data", None)
    zone_entities, gateway_entities = _entity_map(hass, entry)

    areas = ar.async_get(hass)
    floors = fr.async_get(hass)

    payload: dict[str, Any] = {
        "entry": {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "data": dict(entry.data),
            "options": dict(entry.options),
        },
        "presets": entry.options.get(CONF_PRESETS, {}),
        "season": entry.options.get(CONF_SEASON),
        "default_preset": entry.options.get(CONF_DEFAULT_PRESET),
        "outdoor_entity_id": entry.data.get(CONF_OUTDOOR_ENTITY_ID),
        "gateway_entities": gateway_entities,
        "areas": [
            {"area_id": a.id, "name": a.name, "floor_id": a.floor_id}
            for a in areas.areas.values()
        ],
        "floors": [
            {"floor_id": f.floor_id, "name": f.name} for f in floors.floors.values()
        ],
        "zones": [],
        "periods": [],
    }

    if coordinator is not None:
        payload["master_heat"] = coordinator.master_heat
        payload["master_cool"] = coordinator.master_cool
        payload["temperature_unit"] = coordinator.temperature_unit
        for subentry_id in coordinator.zones:
            payload["zones"].append(
                _zone_payload(
                    coordinator, zone_entities.get(subentry_id, {}), subentry_id
                )
            )
        for period in coordinator.periods:
            payload["periods"].append(
                {
                    "subentry_id": period.subentry_id,
                    "title": period.title,
                    "zones": list(period.zones),
                    "days": list(period.days),
                    "from_time": period.from_time.isoformat(),
                    "to_time": period.to_time.isoformat(),
                    "preset": period.preset,
                }
            )
    else:
        # Entry present but not loaded (e.g. no zone subentry yet): still list
        # subentry titles so the panel can guide the user.
        for sub in entry.subentries.values():
            if sub.subentry_type == SUBENTRY_TYPE_ZONE:
                payload["zones"].append(
                    {
                        "subentry_id": sub.subentry_id,
                        "title": sub.title,
                        "name": sub.data.get("zone_name", sub.title),
                        "area_id": sub.data.get(CONF_AREA_ID),
                        "floor_id": sub.data.get(CONF_FLOOR_ID),
                        "temperature_sensors": sub.data.get(
                            CONF_TEMPERATURE_SENSORS, []
                        ),
                        "humidity_sensor": sub.data.get(CONF_HUMIDITY_SENSOR),
                        "actuators": sub.data.get("actuators", []),
                        "aggregation": sub.data.get("aggregation"),
                        "control_overrides": sub.data.get("control", {}),
                        "entities": zone_entities.get(sub.subentry_id, {}),
                        "state": None,
                    }
                )
            elif sub.subentry_type == SUBENTRY_TYPE_PERIOD:
                payload["periods"].append(
                    {
                        "subentry_id": sub.subentry_id,
                        "title": sub.title,
                        "zones": sub.data.get("zones", []),
                        "days": sub.data.get(CONF_DAYS, []),
                        "from_time": sub.data.get(CONF_FROM_TIME),
                        "to_time": sub.data.get(CONF_TO_TIME),
                        "preset": sub.data.get(CONF_PRESET),
                    }
                )

    connection.send_result(msg["id"], payload)
