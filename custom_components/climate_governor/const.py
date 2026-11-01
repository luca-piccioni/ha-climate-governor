"""Constants for Climate Governor."""

from homeassistant.const import Platform

DOMAIN = "climate_governor"
LOGGER_NAME = DOMAIN

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.CLIMATE,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
]

CONFIG_VERSION = 2
CONFIG_VERSION_MINOR = 0

# --- Subentry types -----------------------------------------------------------
SUBENTRY_TYPE_ZONE = "zone"
SUBENTRY_TYPE_PERIOD = "period"

# --- Config entry data (system config) ----------------------------------------
CONF_NAME = "name"
CONF_OUTDOOR_ENTITY_ID = "outdoor_entity_id"
CONF_OUTDOOR_DESIGN_TEMP = "outdoor_design_temp"
CONF_SENSOR_AGGREGATION = "sensor_aggregation"
CONF_STALE_AFTER = "stale_after"

# --- Zone subentry data -------------------------------------------------------
CONF_ZONE_NAME = "zone_name"
CONF_AREA_ID = "area_id"
CONF_FLOOR_ID = "floor_id"
CONF_TEMPERATURE_SENSORS = "temperature_sensors"
CONF_HUMIDITY_SENSOR = "humidity_sensor"
CONF_ACTUATORS = "actuators"
CONF_AGGREGATION = "aggregation"
CONF_CONTROL = "control"

# Actuator spec keys
CONF_ACTUATOR_ENTITY_ID = "entity_id"
CONF_ACTUATOR_KIND = "kind"
CONF_ACTUATOR_ROLE = "role"

# Zone form fields (mapped to the actuators list on save)
CONF_HEAT_SWITCH = "heat_switch"
CONF_HEAT_CLIMATE = "heat_climate"
CONF_COOL_CLIMATE = "cool_climate"

ACTUATOR_KIND_SWITCH = "switch"
ACTUATOR_KIND_CLIMATE = "climate"
ACTUATOR_ROLE_HEAT = "heat"
ACTUATOR_ROLE_COOL = "cool"
ACTUATOR_ROLE_DEHUMIDIFY = "dehumidify"

AGGREGATION_MEAN = "mean"
AGGREGATION_MEDIAN = "median"
AGGREGATION_MIN = "min"
AGGREGATION_MAX = "max"

# --- Period subentry data -----------------------------------------------------
CONF_ZONES = "zones"
CONF_DAYS = "days"
CONF_FROM_TIME = "from_time"
CONF_TO_TIME = "to_time"
CONF_PRESET = "preset"

# --- Options (user config) ----------------------------------------------------
CONF_PRESETS = "presets"
CONF_SEASON = "season"
CONF_DEFAULT_PRESET = "default_preset"
CONF_TOLERANCE = "tolerance"
CONF_KP = "kp"
CONF_KI = "ki"
CONF_CYCLE_WINDOW = "cycle_window"
CONF_TAU_I = "tau_i"
CONF_MAX_OFFSET = "max_offset"
CONF_OUTDOOR_RESET_GAIN = "outdoor_reset_gain"
CONF_OUTDOOR_RESET_MAX = "outdoor_reset_max"
CONF_MIN_ON = "min_on"
CONF_MIN_OFF = "min_off"
CONF_CYCLE_COOLDOWN = "cycle_cooldown"
CONF_MASTER_HEAT = "master_heat"
CONF_MASTER_COOL = "master_cool"

# --- Defaults -----------------------------------------------------------------
DEFAULT_TOLERANCE = 0.3
DEFAULT_KP = 40.0
DEFAULT_KI = 8.0
DEFAULT_CYCLE_WINDOW = 900
DEFAULT_TAU_I = 3600.0
DEFAULT_MAX_OFFSET = 1.5
DEFAULT_OUTDOOR_RESET_GAIN = 0.6
DEFAULT_OUTDOOR_RESET_MAX = 3.0
DEFAULT_OUTDOOR_DESIGN_TEMP = -7.0
DEFAULT_MIN_ON = 60
DEFAULT_MIN_OFF = 120
DEFAULT_CYCLE_COOLDOWN = 60
DEFAULT_STALE_AFTER = 3600
DEFAULT_PRESET = "comfort"
DEFAULT_SEASON = "heating"
DEFAULT_TICK_INTERVAL_SECONDS = 60

PRESET_ECO = "eco"
PRESET_COMFORT = "comfort"
PRESET_BOOST = "boost"
PRESET_AWAY = "away"
PRESET_SLEEP = "sleep"

PRESET_HEAT_KEY = "heat"
PRESET_COOL_KEY = "cool"

DEFAULT_PRESETS: dict[str, dict[str, float]] = {
    PRESET_ECO: {PRESET_HEAT_KEY: 18.0, PRESET_COOL_KEY: 28.0},
    PRESET_COMFORT: {PRESET_HEAT_KEY: 21.0, PRESET_COOL_KEY: 25.5},
    PRESET_BOOST: {PRESET_HEAT_KEY: 23.0, PRESET_COOL_KEY: 24.0},
    PRESET_AWAY: {PRESET_HEAT_KEY: 16.0, PRESET_COOL_KEY: 30.0},
    PRESET_SLEEP: {PRESET_HEAT_KEY: 18.5, PRESET_COOL_KEY: 27.0},
}

SEASON_HEATING = "heating"
SEASON_SHOULDER = "shoulder"
SEASON_COOLING = "cooling"

# Season -> parameter multipliers
SEASON_MULTIPLIERS: dict[str, dict[str, float]] = {
    SEASON_HEATING: {
        CONF_KP: 1.2,
        CONF_KI: 1.2,
        CONF_TOLERANCE: 0.8,
        CONF_MAX_OFFSET: 1.2,
        CONF_OUTDOOR_RESET_GAIN: 1.2,
    },
    SEASON_SHOULDER: {
        CONF_KP: 1.0,
        CONF_KI: 1.0,
        CONF_TOLERANCE: 1.0,
        CONF_MAX_OFFSET: 1.0,
        CONF_OUTDOOR_RESET_GAIN: 1.0,
    },
    SEASON_COOLING: {
        CONF_KP: 0.9,
        CONF_KI: 0.8,
        CONF_TOLERANCE: 1.2,
        CONF_MAX_OFFSET: 0.9,
        CONF_OUTDOOR_RESET_GAIN: 0.8,
    },
}

# --- Numeric bounds (min, max, step, unit) --------------------------------------
# Single source of truth shared by the options flow and the configuration panel,
# so the two never drift on what values are accepted.
PRESET_HEAT_BOUNDS: tuple[float, float, float, str | None] = (5.0, 40.0, 0.5, "°C")
PRESET_COOL_BOUNDS: tuple[float, float, float, str | None] = (10.0, 45.0, 0.5, "°C")
TUNING_BOUNDS: dict[str, tuple[float, float, float, str | None]] = {
    CONF_TOLERANCE: (0.1, 3.0, 0.1, "°C"),
    CONF_KP: (0.0, 200.0, 1.0, None),
    CONF_KI: (0.0, 100.0, 0.5, None),
    CONF_MAX_OFFSET: (0.0, 5.0, 0.1, "°C"),
    CONF_CYCLE_WINDOW: (120.0, 7200.0, 30.0, "s"),
}
TUNING_KEYS: tuple[str, ...] = tuple(TUNING_BOUNDS)

# --- Repair issue keys ----------------------------------------------------------
ISSUE_NO_OUTDOOR_SOURCE = "no_outdoor_source"
ISSUE_ACTUATOR_CAPABILITY_MISMATCH = "actuator_capability_mismatch"
ISSUE_ZONE_NO_ACTUATOR = "zone_no_actuator"