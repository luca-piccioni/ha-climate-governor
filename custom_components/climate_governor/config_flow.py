"""Config flow for Climate Governor."""

from collections.abc import Mapping
from typing import Any, override

import probatio
from homeassistant import data_entry_flow
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.core import callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import selector

from .const import (
    ACTUATOR_KIND_CLIMATE,
    ACTUATOR_KIND_SWITCH,
    ACTUATOR_ROLE_COOL,
    ACTUATOR_ROLE_HEAT,
    AGGREGATION_MAX,
    AGGREGATION_MEAN,
    AGGREGATION_MEDIAN,
    AGGREGATION_MIN,
    CONF_ACTUATOR_ENTITY_ID,
    CONF_ACTUATOR_KIND,
    CONF_ACTUATOR_ROLE,
    CONF_ACTUATORS,
    CONF_AGGREGATION,
    CONF_AREA_ID,
    CONF_CONTROL,
    CONF_COOL_CLIMATE,
    CONF_CYCLE_WINDOW,
    CONF_DAYS,
    CONF_DEFAULT_PRESET,
    CONF_FLOOR_ID,
    CONF_FROM_TIME,
    CONF_HEAT_CLIMATE,
    CONF_HEAT_SWITCH,
    CONF_HUMIDITY_SENSOR,
    CONF_KI,
    CONF_KP,
    CONF_MAX_OFFSET,
    CONF_NAME,
    CONF_OUTDOOR_DESIGN_TEMP,
    CONF_OUTDOOR_ENTITY_ID,
    CONF_PRESET,
    CONF_PRESETS,
    CONF_SEASON,
    CONF_TEMPERATURE_SENSORS,
    CONF_TO_TIME,
    CONF_TOLERANCE,
    CONF_ZONE_NAME,
    CONF_ZONES,
    DEFAULT_CYCLE_WINDOW,
    DEFAULT_KI,
    DEFAULT_KP,
    DEFAULT_MAX_OFFSET,
    DEFAULT_OUTDOOR_DESIGN_TEMP,
    DEFAULT_PRESET,
    DEFAULT_PRESETS,
    DEFAULT_SEASON,
    DEFAULT_TOLERANCE,
    DOMAIN,
    PRESET_COOL_BOUNDS,
    PRESET_COOL_KEY,
    PRESET_HEAT_BOUNDS,
    PRESET_HEAT_KEY,
    SEASON_COOLING,
    SEASON_HEATING,
    SEASON_SHOULDER,
    SUBENTRY_TYPE_PERIOD,
    SUBENTRY_TYPE_ZONE,
    TUNING_BOUNDS,
)
from .models import parse_period_subentry

DAY_OPTIONS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
DAY_TO_INDEX = dict(zip(DAY_OPTIONS, range(7), strict=True))
INDEX_TO_DAY = {index: day for day, index in DAY_TO_INDEX.items()}
AGGREGATION_OPTIONS = [
    AGGREGATION_MEAN,
    AGGREGATION_MEDIAN,
    AGGREGATION_MIN,
    AGGREGATION_MAX,
]
SEASON_OPTIONS = [SEASON_HEATING, SEASON_SHOULDER, SEASON_COOLING]

SECTION_ADVANCED = "advanced"


def _number(
    minimum: float, maximum: float, step: float, unit: str | None = None
) -> selector.NumberSelector:
    config = selector.NumberSelectorConfig(
        min=minimum,
        max=maximum,
        step=step,
        mode=selector.NumberSelectorMode.BOX,
    )
    if unit is not None:
        config["unit_of_measurement"] = unit
    return selector.NumberSelector(config)


def _tuning_number(key: str) -> probatio.All:
    """Build a validated number field for a tuning key from the shared bounds."""
    minimum, maximum, step, unit = TUNING_BOUNDS[key]
    coerce = (
        probatio.Coerce(int) if key == CONF_CYCLE_WINDOW else probatio.Coerce(float)
    )
    return probatio.All(_number(minimum, maximum, step, unit), coerce)


def _preset_number(bounds: tuple[float, float, float, str | None]) -> probatio.All:
    return probatio.All(_number(*bounds), probatio.Coerce(float))


SYSTEM_SCHEMA = probatio.Schema(
    {
        probatio.Required(CONF_NAME, default="Climate Governor"):
        selector.TextSelector(),
        probatio.Optional(CONF_OUTDOOR_ENTITY_ID): selector.EntitySelector(
            selector.EntitySelectorConfig(domain=["sensor", "weather"])
        ),
        probatio.Required(
            CONF_OUTDOOR_DESIGN_TEMP, default=DEFAULT_OUTDOOR_DESIGN_TEMP
        ): probatio.All(
            _number(-30, 10, 0.5, "°C"),
            probatio.Coerce(float),
        ),
    }
)

CONTROL_SCHEMA = probatio.Schema(
    {
        probatio.Optional(key, default=default): _tuning_number(key)
        for key, default in (
            (CONF_TOLERANCE, DEFAULT_TOLERANCE),
            (CONF_KP, DEFAULT_KP),
            (CONF_KI, DEFAULT_KI),
            (CONF_MAX_OFFSET, DEFAULT_MAX_OFFSET),
            (CONF_CYCLE_WINDOW, DEFAULT_CYCLE_WINDOW),
        )
    }
)


def _zone_schema() -> probatio.Schema:
    return probatio.Schema(
        {
            probatio.Required(CONF_ZONE_NAME): selector.TextSelector(),
            probatio.Optional(CONF_AREA_ID): selector.AreaSelector(),
            probatio.Optional(CONF_FLOOR_ID): selector.FloorSelector(),
            probatio.Required(CONF_TEMPERATURE_SENSORS): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="sensor", multiple=True)
            ),
            probatio.Optional(CONF_HUMIDITY_SENSOR): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="sensor")
            ),
            probatio.Optional(CONF_HEAT_SWITCH): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="switch")
            ),
            probatio.Optional(CONF_HEAT_CLIMATE): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="climate")
            ),
            probatio.Optional(CONF_COOL_CLIMATE): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="climate")
            ),
            probatio.Required(CONF_AGGREGATION, default=AGGREGATION_MEAN): (
                selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=AGGREGATION_OPTIONS, translation_key="aggregation"
                    )
                )
            ),
            probatio.Optional(SECTION_ADVANCED): data_entry_flow.section(
                CONTROL_SCHEMA, {"collapsed": True}
            ),
        }
    )


def _period_schema(
    zone_options: list[str], preset_options: list[str]
) -> probatio.Schema:
    return probatio.Schema(
        {
            probatio.Required(CONF_ZONES): selector.SelectSelector(
                selector.SelectSelectorConfig(options=zone_options, multiple=True)
            ),
            probatio.Required(CONF_DAYS): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=DAY_OPTIONS, multiple=True, translation_key="day"
                )
            ),
            probatio.Required(CONF_FROM_TIME, default="06:30"): probatio.All(
                selector.TimeSelector(), cv.time, probatio.Coerce(str)
            ),
            probatio.Required(CONF_TO_TIME, default="08:30"): probatio.All(
                selector.TimeSelector(), cv.time, probatio.Coerce(str)
            ),
            probatio.Required(
                CONF_PRESET, default=DEFAULT_PRESET
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=preset_options, translation_key="preset"
                )
            ),
        }
    )


def _actuators_from_form(user_input: Mapping[str, Any]) -> list[dict[str, str]]:
    """Build the stored actuators list from the flat form fields."""
    actuators: list[dict[str, str]] = []
    for key, kind, role in (
        (CONF_HEAT_SWITCH, ACTUATOR_KIND_SWITCH, ACTUATOR_ROLE_HEAT),
        (CONF_HEAT_CLIMATE, ACTUATOR_KIND_CLIMATE, ACTUATOR_ROLE_HEAT),
        (CONF_COOL_CLIMATE, ACTUATOR_KIND_CLIMATE, ACTUATOR_ROLE_COOL),
    ):
        if entity_id := user_input.get(key):
            actuators.append(
                {
                    CONF_ACTUATOR_ENTITY_ID: str(entity_id),
                    CONF_ACTUATOR_KIND: kind,
                    CONF_ACTUATOR_ROLE: role,
                }
            )
    return actuators


def _zone_data_from_form(user_input: Mapping[str, Any]) -> dict[str, Any]:
    """Map the flat zone form onto the stored subentry data."""
    data: dict[str, Any] = {
        CONF_ZONE_NAME: str(user_input[CONF_ZONE_NAME]),
        CONF_AREA_ID: user_input.get(CONF_AREA_ID) or None,
        CONF_FLOOR_ID: user_input.get(CONF_FLOOR_ID) or None,
        CONF_TEMPERATURE_SENSORS: [
            str(s) for s in user_input.get(CONF_TEMPERATURE_SENSORS) or []
        ],
        CONF_HUMIDITY_SENSOR: user_input.get(CONF_HUMIDITY_SENSOR) or None,
        CONF_ACTUATORS: _actuators_from_form(user_input),
        CONF_AGGREGATION: user_input.get(CONF_AGGREGATION, AGGREGATION_MEAN),
    }
    advanced = user_input.get(SECTION_ADVANCED) or {}
    if advanced:
        data[CONF_CONTROL] = {
            key: float(value)
            for key, value in advanced.items()
            if isinstance(value, (int, float))
        }
    return data


def _form_from_zone(zone: Mapping[str, Any]) -> dict[str, Any]:
    """Reverse :func:`_actuators_from_form` for reconfigure suggestions."""
    form: dict[str, Any] = {
        CONF_ZONE_NAME: zone.get(CONF_ZONE_NAME, ""),
        CONF_TEMPERATURE_SENSORS: list(zone.get(CONF_TEMPERATURE_SENSORS) or []),
        CONF_AGGREGATION: zone.get(CONF_AGGREGATION, AGGREGATION_MEAN),
    }
    if zone.get(CONF_AREA_ID):
        form[CONF_AREA_ID] = zone[CONF_AREA_ID]
    if zone.get(CONF_FLOOR_ID):
        form[CONF_FLOOR_ID] = zone[CONF_FLOOR_ID]
    if zone.get(CONF_HUMIDITY_SENSOR):
        form[CONF_HUMIDITY_SENSOR] = zone[CONF_HUMIDITY_SENSOR]
    for act in zone.get(CONF_ACTUATORS) or []:
        if act.get(CONF_ACTUATOR_KIND) == ACTUATOR_KIND_SWITCH:
            key = CONF_HEAT_SWITCH
        elif act.get(CONF_ACTUATOR_ROLE) == ACTUATOR_ROLE_COOL:
            key = CONF_COOL_CLIMATE
        else:
            key = CONF_HEAT_CLIMATE
        form[key] = act.get(CONF_ACTUATOR_ENTITY_ID)
    if control := zone.get(CONF_CONTROL):
        form[SECTION_ADVANCED] = dict(control)
    return form


def _period_data_from_form(user_input: Mapping[str, Any]) -> dict[str, Any]:
    return {
        CONF_ZONES: [str(z) for z in user_input.get(CONF_ZONES) or []],
        CONF_DAYS: [
            DAY_TO_INDEX[d]
            for d in user_input.get(CONF_DAYS) or []
            if d in DAY_TO_INDEX
        ],
        CONF_FROM_TIME: str(user_input.get(CONF_FROM_TIME) or "06:30"),
        CONF_TO_TIME: str(user_input.get(CONF_TO_TIME) or "08:30"),
        CONF_PRESET: str(user_input.get(CONF_PRESET, DEFAULT_PRESET)),
    }


def _period_title(user_input: Mapping[str, Any]) -> str:
    days = ",".join(str(d) for d in user_input.get(CONF_DAYS) or [])
    return (
        f"{days} {user_input.get(CONF_FROM_TIME, '06:30')}"
        f"-{user_input.get(CONF_TO_TIME, '08:30')} "
        f"{user_input.get(CONF_PRESET, DEFAULT_PRESET)}"
    )


class ClimateGovernorConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the config flow for Climate Governor."""

    VERSION = 2

    def __init__(self) -> None:
        """Store the system input between the user and zone steps."""
        self._system_input: dict[str, Any] = {}

    @staticmethod
    @callback
    @override
    def async_get_options_flow(config_entry: ConfigEntry) -> GovernorOptionsFlow:
        """Get the options flow for this handler."""
        return GovernorOptionsFlow()

    @classmethod
    @callback
    @override
    def async_get_supported_subentry_types(
        cls, config_entry: ConfigEntry
    ) -> dict[str, type[ConfigSubentryFlow]]:
        """Return the subentry types supported by this handler."""
        return {
            SUBENTRY_TYPE_ZONE: ZoneSubentryFlow,
            SUBENTRY_TYPE_PERIOD: PeriodSubentryFlow,
        }

    @override
    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step: system-wide configuration."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            self._system_input = user_input
            return await self.async_step_zone()

        return self.async_show_form(step_id="user", data_schema=SYSTEM_SCHEMA)

    async def async_step_zone(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Create the first zone subentry together with the entry."""
        errors: dict[str, str] = {}
        if user_input is not None:
            if not user_input.get(CONF_TEMPERATURE_SENSORS):
                errors[CONF_TEMPERATURE_SENSORS] = "no_sensors"
            elif not _actuators_from_form(user_input):
                errors[CONF_HEAT_SWITCH] = "no_actuator"
            else:
                return self.async_create_entry(
                    title=str(self._system_input[CONF_NAME]),
                    data=dict(self._system_input),
                    subentries=[
                        {
                            "subentry_type": SUBENTRY_TYPE_ZONE,
                            "title": str(user_input[CONF_ZONE_NAME]),
                            "data": _zone_data_from_form(user_input),
                            "unique_id": None,
                        }
                    ],
                )

        return self.async_show_form(
            step_id="zone",
            data_schema=self.add_suggested_values_to_schema(
                _zone_schema(), user_input or {}
            ),
            errors=errors,
        )

    @override
    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Reconfigure the system-wide settings."""
        entry = self._get_reconfigure_entry()
        if user_input is not None:
            self.hass.config_entries.async_update_entry(entry, data=user_input)
            return self.async_abort(reason="reconfigure_successful")

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(SYSTEM_SCHEMA, entry.data),
        )


class GovernorOptionsFlow(OptionsFlow):
    """Manage the user-facing options: presets, control defaults, season."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show the options menu."""
        return self.async_show_menu(
            step_id="init", menu_options=["presets", "control", "season"]
        )

    def _save_options(self, updates: Mapping[str, Any]) -> None:
        self.hass.config_entries.async_update_entry(
            self.config_entry, options=self.config_entry.options | dict(updates)
        )

    async def async_step_presets(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Edit the preset setpoints."""
        current: dict[str, Any] = dict(
            self.config_entry.options.get(CONF_PRESETS) or DEFAULT_PRESETS
        )
        if user_input is not None:
            presets = dict(current)
            for preset in DEFAULT_PRESETS:
                heat = user_input.get(f"{preset}_{PRESET_HEAT_KEY}")
                cool = user_input.get(f"{preset}_{PRESET_COOL_KEY}")
                if heat is not None or cool is not None:
                    presets[preset] = {
                        PRESET_HEAT_KEY: float(
                            heat
                            if heat is not None
                            else current.get(preset, {}).get(PRESET_HEAT_KEY, 18.0)
                        ),
                        PRESET_COOL_KEY: float(
                            cool
                            if cool is not None
                            else current.get(preset, {}).get(PRESET_COOL_KEY, 28.0)
                        ),
                    }
            self._save_options(
                {
                    CONF_PRESETS: presets,
                    CONF_DEFAULT_PRESET: user_input.get(
                        CONF_DEFAULT_PRESET, DEFAULT_PRESET
                    ),
                }
            )
            return self.async_abort(reason="reconfigure_successful")

        schema_dict: dict[Any, Any] = {}
        suggested: dict[str, Any] = {}
        for preset in DEFAULT_PRESETS:
            heat_key = f"{preset}_{PRESET_HEAT_KEY}"
            cool_key = f"{preset}_{PRESET_COOL_KEY}"
            schema_dict[probatio.Optional(heat_key)] = _preset_number(
                PRESET_HEAT_BOUNDS
            )
            schema_dict[probatio.Optional(cool_key)] = _preset_number(
                PRESET_COOL_BOUNDS
            )
            suggested[heat_key] = current.get(preset, {}).get(PRESET_HEAT_KEY)
            suggested[cool_key] = current.get(preset, {}).get(PRESET_COOL_KEY)
        schema_dict[probatio.Optional(CONF_DEFAULT_PRESET)] = selector.SelectSelector(
            selector.SelectSelectorConfig(
                options=list(DEFAULT_PRESETS), translation_key="preset"
            )
        )
        suggested[CONF_DEFAULT_PRESET] = self.config_entry.options.get(
            CONF_DEFAULT_PRESET, DEFAULT_PRESET
        )
        return self.async_show_form(
            step_id="presets",
            data_schema=self.add_suggested_values_to_schema(
                probatio.Schema(schema_dict), suggested
            ),
        )

    async def async_step_control(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Edit the global control defaults."""
        if user_input is not None:
            self._save_options(user_input)
            return self.async_abort(reason="reconfigure_successful")

        options = self.config_entry.options
        schema_dict = {
            probatio.Optional(key, default=options.get(key)): _tuning_number(key)
            for key in TUNING_BOUNDS
        }
        return self.async_show_form(
            step_id="control", data_schema=probatio.Schema(schema_dict)
        )

    async def async_step_season(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pick the active season."""
        if user_input is not None:
            self._save_options(user_input)
            return self.async_abort(reason="reconfigure_successful")

        return self.async_show_form(
            step_id="season",
            data_schema=probatio.Schema(
                {
                    probatio.Required(
                        CONF_SEASON,
                        default=self.config_entry.options.get(
                            CONF_SEASON, DEFAULT_SEASON
                        ),
                    ): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=SEASON_OPTIONS, translation_key="season"
                        )
                    )
                }
            ),
        )


class ZoneSubentryFlow(ConfigSubentryFlow):
    """Add or reconfigure a zone subentry."""

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        """Add a new zone."""
        errors: dict[str, str] = {}
        if user_input is not None:
            if not user_input.get(CONF_TEMPERATURE_SENSORS):
                errors[CONF_TEMPERATURE_SENSORS] = "no_sensors"
            elif not _actuators_from_form(user_input):
                errors[CONF_HEAT_SWITCH] = "no_actuator"
            else:
                return self.async_create_entry(
                    title=str(user_input[CONF_ZONE_NAME]),
                    data=_zone_data_from_form(user_input),
                )

        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(
                _zone_schema(), user_input or {}
            ),
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        """Reconfigure an existing zone."""
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            if not user_input.get(CONF_TEMPERATURE_SENSORS):
                errors[CONF_TEMPERATURE_SENSORS] = "no_sensors"
            elif not _actuators_from_form(user_input):
                errors[CONF_HEAT_SWITCH] = "no_actuator"
            else:
                return self.async_update_and_abort(
                    self._get_entry(),
                    subentry,
                    title=str(user_input[CONF_ZONE_NAME]),
                    data=_zone_data_from_form(user_input),
                )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(
                _zone_schema(), user_input or _form_from_zone(subentry.data)
            ),
            errors=errors,
        )


class PeriodSubentryFlow(ConfigSubentryFlow):
    """Add or reconfigure a schedule period subentry."""

    def _zone_options(self) -> list[str]:
        return [
            subentry.subentry_id
            for subentry in self._get_entry().get_subentries_of_type(SUBENTRY_TYPE_ZONE)
        ]

    def _preset_options(self) -> list[str]:
        return list(self._get_entry().options.get(CONF_PRESETS) or DEFAULT_PRESETS)

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        """Add a new period."""
        if not self._zone_options():
            return self.async_abort(reason="no_zones")

        errors: dict[str, str] = {}
        if user_input is not None:
            if not user_input.get(CONF_ZONES):
                errors[CONF_ZONES] = "no_zones"
            elif not user_input.get(CONF_DAYS):
                errors[CONF_DAYS] = "no_days"
            else:
                return self.async_create_entry(
                    title=_period_title(user_input),
                    data=_period_data_from_form(user_input),
                )

        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(
                _period_schema(
                    self._zone_options(), self._preset_options()
                ),
                user_input or {},
            ),
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        """Reconfigure an existing period."""
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            if not user_input.get(CONF_ZONES):
                errors[CONF_ZONES] = "no_zones"
            elif not user_input.get(CONF_DAYS):
                errors[CONF_DAYS] = "no_days"
            else:
                return self.async_update_and_abort(
                    self._get_entry(),
                    subentry,
                    title=_period_title(user_input),
                    data=_period_data_from_form(user_input),
                )

        spec = parse_period_subentry(subentry)
        suggested = {
            CONF_ZONES: list(spec.zones),
            CONF_DAYS: [INDEX_TO_DAY[d] for d in spec.days if d in INDEX_TO_DAY],
            CONF_FROM_TIME: spec.from_time.strftime("%H:%M"),
            CONF_TO_TIME: spec.to_time.strftime("%H:%M"),
            CONF_PRESET: spec.preset,
        }
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(
                _period_schema(self._zone_options(), self._preset_options()),
                user_input or suggested,
            ),
            errors=errors,
        )
