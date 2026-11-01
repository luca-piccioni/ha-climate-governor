"""Typed configuration models for Climate Governor.

Parsers here are defensive: config entry data is stored as plain dicts and
may come from migrations, so every field has a sane fallback.
"""

from dataclasses import dataclass, field
from datetime import time

from homeassistant.config_entries import ConfigSubentry

from .const import (
    ACTUATOR_KIND_CLIMATE,
    ACTUATOR_KIND_SWITCH,
    ACTUATOR_ROLE_COOL,
    ACTUATOR_ROLE_DEHUMIDIFY,
    ACTUATOR_ROLE_HEAT,
    AGGREGATION_MEAN,
    CONF_ACTUATOR_ENTITY_ID,
    CONF_ACTUATOR_KIND,
    CONF_ACTUATOR_ROLE,
    CONF_ACTUATORS,
    CONF_AGGREGATION,
    CONF_AREA_ID,
    CONF_CONTROL,
    CONF_CYCLE_COOLDOWN,
    CONF_CYCLE_WINDOW,
    CONF_DAYS,
    CONF_DEFAULT_PRESET,
    CONF_FLOOR_ID,
    CONF_FROM_TIME,
    CONF_HUMIDITY_SENSOR,
    CONF_KI,
    CONF_KP,
    CONF_MAX_OFFSET,
    CONF_MIN_OFF,
    CONF_MIN_ON,
    CONF_NAME,
    CONF_OUTDOOR_DESIGN_TEMP,
    CONF_OUTDOOR_ENTITY_ID,
    CONF_OUTDOOR_RESET_GAIN,
    CONF_OUTDOOR_RESET_MAX,
    CONF_PRESET,
    CONF_PRESETS,
    CONF_SEASON,
    CONF_SENSOR_AGGREGATION,
    CONF_STALE_AFTER,
    CONF_TAU_I,
    CONF_TEMPERATURE_SENSORS,
    CONF_TO_TIME,
    CONF_TOLERANCE,
    CONF_ZONE_NAME,
    CONF_ZONES,
    DEFAULT_CYCLE_COOLDOWN,
    DEFAULT_CYCLE_WINDOW,
    DEFAULT_KI,
    DEFAULT_KP,
    DEFAULT_MAX_OFFSET,
    DEFAULT_MIN_OFF,
    DEFAULT_MIN_ON,
    DEFAULT_OUTDOOR_DESIGN_TEMP,
    DEFAULT_OUTDOOR_RESET_GAIN,
    DEFAULT_OUTDOOR_RESET_MAX,
    DEFAULT_PRESET,
    DEFAULT_PRESETS,
    DEFAULT_SEASON,
    DEFAULT_STALE_AFTER,
    DEFAULT_TAU_I,
    DEFAULT_TOLERANCE,
    PRESET_COOL_KEY,
    PRESET_HEAT_KEY,
    SEASON_MULTIPLIERS,
)
from .control import ControlParams

VALID_ACTUATOR_KINDS = (ACTUATOR_KIND_SWITCH, ACTUATOR_KIND_CLIMATE)
VALID_ACTUATOR_ROLES = (
    ACTUATOR_ROLE_HEAT,
    ACTUATOR_ROLE_COOL,
    ACTUATOR_ROLE_DEHUMIDIFY,
)


@dataclass(frozen=True, slots=True)
class ActuatorSpec:
    """Configured actuator for a zone."""

    entity_id: str
    kind: str
    role: str


@dataclass(frozen=True, slots=True)
class ZoneSpec:
    """Parsed zone subentry."""

    subentry_id: str
    title: str
    name: str
    area_id: str | None
    floor_id: str | None
    temperature_sensors: tuple[str, ...]
    humidity_sensor: str | None
    actuators: tuple[ActuatorSpec, ...]
    aggregation: str
    control_overrides: dict[str, float]


@dataclass(frozen=True, slots=True)
class PeriodSpec:
    """Parsed period subentry."""

    subentry_id: str
    title: str
    zones: tuple[str, ...]
    days: tuple[int, ...]
    from_time: time
    to_time: time
    preset: str


@dataclass(frozen=True, slots=True)
class GovernorConfig:
    """Parsed config entry data."""

    name: str
    outdoor_entity_id: str | None
    outdoor_design_temp: float
    sensor_aggregation: str
    stale_after: int


@dataclass(frozen=True, slots=True)
class GovernorOptions:
    """Parsed config entry options (user config)."""

    presets: dict[str, dict[str, float]] = field(
        default_factory=lambda: dict(DEFAULT_PRESETS)
    )
    season: str = DEFAULT_SEASON
    default_preset: str = DEFAULT_PRESET
    tolerance: float = DEFAULT_TOLERANCE
    kp: float = DEFAULT_KP
    ki: float = DEFAULT_KI
    cycle_window: float = DEFAULT_CYCLE_WINDOW
    tau_i: float = DEFAULT_TAU_I
    max_offset: float = DEFAULT_MAX_OFFSET
    outdoor_reset_gain: float = DEFAULT_OUTDOOR_RESET_GAIN
    outdoor_reset_max: float = DEFAULT_OUTDOOR_RESET_MAX
    min_on: float = DEFAULT_MIN_ON
    min_off: float = DEFAULT_MIN_OFF
    cycle_cooldown: float = DEFAULT_CYCLE_COOLDOWN

    def control_params(
        self, overrides: dict[str, float] | None = None
    ) -> ControlParams:
        """Build effective (unscaled) control params from options + zone overrides."""
        merged: dict[str, float] = {
            CONF_TOLERANCE: self.tolerance,
            CONF_KP: self.kp,
            CONF_KI: self.ki,
            CONF_CYCLE_WINDOW: self.cycle_window,
            CONF_TAU_I: self.tau_i,
            CONF_MAX_OFFSET: self.max_offset,
            CONF_OUTDOOR_RESET_GAIN: self.outdoor_reset_gain,
            CONF_OUTDOOR_RESET_MAX: self.outdoor_reset_max,
            CONF_MIN_ON: self.min_on,
            CONF_MIN_OFF: self.min_off,
            CONF_CYCLE_COOLDOWN: self.cycle_cooldown,
        }
        if overrides:
            merged.update(overrides)
        return ControlParams(
            tolerance=merged[CONF_TOLERANCE],
            kp=merged[CONF_KP],
            ki=merged[CONF_KI],
            cycle_window=merged[CONF_CYCLE_WINDOW],
            tau_i=merged[CONF_TAU_I],
            max_offset=merged[CONF_MAX_OFFSET],
            outdoor_reset_gain=merged[CONF_OUTDOOR_RESET_GAIN],
            outdoor_reset_max=merged[CONF_OUTDOOR_RESET_MAX],
            min_on=merged[CONF_MIN_ON],
            min_off=merged[CONF_MIN_OFF],
            cycle_cooldown=merged[CONF_CYCLE_COOLDOWN],
        )


def parse_governor_config(data: dict) -> GovernorConfig:
    """Parse ``entry.data``."""
    return GovernorConfig(
        name=str(data.get(CONF_NAME) or "Climate Governor"),
        outdoor_entity_id=data.get(CONF_OUTDOOR_ENTITY_ID) or None,
        outdoor_design_temp=float(
            data.get(CONF_OUTDOOR_DESIGN_TEMP, DEFAULT_OUTDOOR_DESIGN_TEMP)
        ),
        sensor_aggregation=str(
            data.get(CONF_SENSOR_AGGREGATION, AGGREGATION_MEAN)
        ),
        stale_after=int(data.get(CONF_STALE_AFTER, DEFAULT_STALE_AFTER)),
    )


def parse_governor_options(options: dict) -> GovernorOptions:
    """Parse ``entry.options``."""
    presets_raw = options.get(CONF_PRESETS) or DEFAULT_PRESETS
    presets = {}
    for preset, vals in presets_raw.items():
        if not isinstance(vals, dict):
            continue
        fallback = DEFAULT_PRESETS.get(preset, {})
        heat = vals.get(PRESET_HEAT_KEY, fallback.get(PRESET_HEAT_KEY, 18.0))
        cool = vals.get(PRESET_COOL_KEY, fallback.get(PRESET_COOL_KEY, 28.0))
        presets[str(preset)] = {
            PRESET_HEAT_KEY: float(heat),
            PRESET_COOL_KEY: float(cool),
        }
    return GovernorOptions(
        presets=presets or dict(DEFAULT_PRESETS),
        season=str(options.get(CONF_SEASON, DEFAULT_SEASON)),
        default_preset=str(options.get(CONF_DEFAULT_PRESET, DEFAULT_PRESET)),
        tolerance=float(options.get(CONF_TOLERANCE, DEFAULT_TOLERANCE)),
        kp=float(options.get(CONF_KP, DEFAULT_KP)),
        ki=float(options.get(CONF_KI, DEFAULT_KI)),
        cycle_window=float(options.get(CONF_CYCLE_WINDOW, DEFAULT_CYCLE_WINDOW)),
        tau_i=float(options.get(CONF_TAU_I, DEFAULT_TAU_I)),
        max_offset=float(options.get(CONF_MAX_OFFSET, DEFAULT_MAX_OFFSET)),
        outdoor_reset_gain=float(
            options.get(CONF_OUTDOOR_RESET_GAIN, DEFAULT_OUTDOOR_RESET_GAIN)
        ),
        outdoor_reset_max=float(
            options.get(CONF_OUTDOOR_RESET_MAX, DEFAULT_OUTDOOR_RESET_MAX)
        ),
        min_on=float(options.get(CONF_MIN_ON, DEFAULT_MIN_ON)),
        min_off=float(options.get(CONF_MIN_OFF, DEFAULT_MIN_OFF)),
        cycle_cooldown=float(
            options.get(CONF_CYCLE_COOLDOWN, DEFAULT_CYCLE_COOLDOWN)
        ),
    )


def parse_actuator(raw: dict) -> ActuatorSpec | None:
    """Parse one actuator row, returning None when unusable."""
    entity_id = str(raw.get(CONF_ACTUATOR_ENTITY_ID, "")).strip()
    if not entity_id:
        return None
    kind = str(raw.get(CONF_ACTUATOR_KIND, ACTUATOR_KIND_SWITCH))
    if kind not in VALID_ACTUATOR_KINDS:
        kind = ACTUATOR_KIND_SWITCH
    role = str(raw.get(CONF_ACTUATOR_ROLE, ACTUATOR_ROLE_HEAT))
    if role not in VALID_ACTUATOR_ROLES:
        role = ACTUATOR_ROLE_HEAT
    return ActuatorSpec(entity_id=entity_id, kind=kind, role=role)


def parse_zone_subentry(subentry: ConfigSubentry) -> ZoneSpec:
    """Parse a zone subentry into a :class:`ZoneSpec`."""
    data = subentry.data
    sensors = tuple(
        str(s).strip()
        for s in (data.get(CONF_TEMPERATURE_SENSORS) or [])
        if str(s).strip()
    )
    actuators = tuple(
        act
        for act in (parse_actuator(raw) for raw in (data.get(CONF_ACTUATORS) or []))
        if act is not None
    )
    overrides_raw = data.get(CONF_CONTROL) or {}
    overrides = {
        str(key): float(value)
        for key, value in overrides_raw.items()
        if isinstance(value, (int, float))
    }
    return ZoneSpec(
        subentry_id=subentry.subentry_id,
        title=subentry.title or "",
        name=str(data.get(CONF_ZONE_NAME) or subentry.title or "Zone"),
        area_id=data.get(CONF_AREA_ID) or None,
        floor_id=data.get(CONF_FLOOR_ID) or None,
        temperature_sensors=sensors,
        humidity_sensor=data.get(CONF_HUMIDITY_SENSOR) or None,
        actuators=actuators,
        aggregation=str(data.get(CONF_AGGREGATION, AGGREGATION_MEAN)),
        control_overrides=overrides,
    )


def parse_period_subentry(subentry: ConfigSubentry) -> PeriodSpec:
    """Parse a period subentry into a :class:`PeriodSpec`."""
    data = subentry.data
    days = tuple(sorted({int(d) % 7 for d in (data.get(CONF_DAYS) or [])}))
    return PeriodSpec(
        subentry_id=subentry.subentry_id,
        title=subentry.title or "",
        zones=tuple(str(z) for z in (data.get(CONF_ZONES) or [])),
        days=days,
        from_time=_parse_time(data.get(CONF_FROM_TIME), time(6, 30)),
        to_time=_parse_time(data.get(CONF_TO_TIME), time(8, 30)),
        preset=str(data.get(CONF_PRESET, DEFAULT_PRESET)),
    )


def _parse_time(value: object, fallback: time) -> time:
    if isinstance(value, time):
        return value
    if isinstance(value, str) and value:
        parts = value.split(":")
        try:
            return time(int(parts[0]), int(parts[1]) if len(parts) > 1 else 0)
        except ValueError:
            return fallback
    return fallback


def apply_season(params: ControlParams, season: str) -> ControlParams:
    """Scale base control params by the season multipliers."""
    mult = SEASON_MULTIPLIERS.get(season, SEASON_MULTIPLIERS[DEFAULT_SEASON])
    return ControlParams(
        kp=params.kp * mult.get(CONF_KP, 1.0),
        ki=params.ki * mult.get(CONF_KI, 1.0),
        tolerance=params.tolerance * mult.get(CONF_TOLERANCE, 1.0),
        cycle_window=params.cycle_window,
        tau_i=params.tau_i,
        max_offset=params.max_offset * mult.get(CONF_MAX_OFFSET, 1.0),
        outdoor_reset_gain=params.outdoor_reset_gain
        * mult.get(CONF_OUTDOOR_RESET_GAIN, 1.0),
        outdoor_reset_max=params.outdoor_reset_max,
        min_on=params.min_on,
        min_off=params.min_off,
        cycle_cooldown=params.cycle_cooldown,
        outdoor_design_temp=params.outdoor_design_temp,
    )
