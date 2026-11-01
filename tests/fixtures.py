"""Reusable fixture builders for Climate Governor tests."""

from collections.abc import Callable

from homeassistant.core import HomeAssistant, ServiceCall

from custom_components.climate_governor.const import (
    ACTUATOR_KIND_SWITCH,
    ACTUATOR_ROLE_HEAT,
    CONF_ACTUATOR_ENTITY_ID,
    CONF_ACTUATOR_KIND,
    CONF_ACTUATOR_ROLE,
    CONF_ACTUATORS,
    CONF_AGGREGATION,
    CONF_AREA_ID,
    CONF_CONTROL,
    CONF_FLOOR_ID,
    CONF_HUMIDITY_SENSOR,
    CONF_TEMPERATURE_SENSORS,
    CONF_ZONE_NAME,
    SUBENTRY_TYPE_ZONE,
)

ZONE_SUBENTRY_ID = "zone-living"


def make_zone_subentry_data(
    *,
    zone_id: str = ZONE_SUBENTRY_ID,
    name: str = "Living",
    sensors: tuple[str, ...] = ("sensor.living_temp",),
    actuators: tuple[dict, ...] = (
        {
            CONF_ACTUATOR_ENTITY_ID: "switch.valve",
            CONF_ACTUATOR_KIND: ACTUATOR_KIND_SWITCH,
            CONF_ACTUATOR_ROLE: ACTUATOR_ROLE_HEAT,
        },
    ),
    area_id: str | None = None,
    floor_id: str | None = None,
    humidity_sensor: str | None = None,
    aggregation: str = "mean",
    control: dict | None = None,
) -> dict:
    """Build one zone subentry in MockConfigEntry storage format."""
    return {
        "subentry_id": zone_id,
        "subentry_type": SUBENTRY_TYPE_ZONE,
        "title": name,
        "unique_id": None,
        "data": {
            CONF_ZONE_NAME: name,
            CONF_AREA_ID: area_id,
            CONF_FLOOR_ID: floor_id,
            CONF_TEMPERATURE_SENSORS: list(sensors),
            CONF_HUMIDITY_SENSOR: humidity_sensor,
            CONF_ACTUATORS: [dict(a) for a in actuators],
            CONF_AGGREGATION: aggregation,
            CONF_CONTROL: dict(control or {}),
        },
    }


def register_fake_switch(hass: HomeAssistant, entity_id: str) -> list[ServiceCall]:
    """Register switch.turn_on/off that actually flip *entity_id* state."""
    calls: list[ServiceCall] = []

    def _make(on: bool) -> Callable[[ServiceCall], None]:
        def handler(call: ServiceCall) -> None:
            calls.append(call)
            for target in call.data.get("entity_id", "").split(","):
                if target.strip() == entity_id:
                    hass.states.async_set(entity_id, "on" if on else "off")

        return handler

    hass.services.async_register("switch", "turn_on", _make(True), schema=None)
    hass.services.async_register("switch", "turn_off", _make(False), schema=None)
    return calls


def register_fake_climate(
    hass: HomeAssistant,
    entity_id: str,
    *,
    hvac_modes: tuple[str, ...] = ("off", "heat", "cool", "heat_cool"),
    features: int = 1,  # TARGET_TEMPERATURE
    min_temp: float = 7.0,
    max_temp: float = 35.0,
) -> list[ServiceCall]:
    """Register climate services that mutate *entity_id* state/attributes."""
    calls: list[ServiceCall] = []
    attrs: dict = {
        "hvac_modes": list(hvac_modes),
        "supported_features": features,
        "min_temp": min_temp,
        "max_temp": max_temp,
        "target_temp_step": 0.5,
    }
    state_holder = {"state": "off"}

    def _set_state() -> None:
        hass.states.async_set(entity_id, state_holder["state"], dict(attrs))

    def _handler(name: str) -> Callable[[ServiceCall], None]:
        def handler(call: ServiceCall) -> None:
            calls.append(call)
            if name == "set_temperature":
                if "temperature" in call.data:
                    attrs["temperature"] = call.data["temperature"]
                if "hvac_mode" in call.data:
                    state_holder["state"] = call.data["hvac_mode"]
                elif state_holder["state"] == "off":
                    state_holder["state"] = "heat"
            elif name == "set_hvac_mode":
                state_holder["state"] = call.data["hvac_mode"]
            elif name == "turn_on":
                if state_holder["state"] == "off":
                    state_holder["state"] = "heat"
            elif name == "turn_off":
                state_holder["state"] = "off"
            _set_state()

        return handler

    for name in ("set_temperature", "set_hvac_mode", "turn_on", "turn_off"):
        hass.services.async_register("climate", name, _handler(name), schema=None)
    _set_state()
    return calls
