"""Sensor aggregation and outdoor source chain for Climate Governor."""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from statistics import median

from homeassistant.components.weather import (
    DOMAIN as WEATHER_DOMAIN,
)
from homeassistant.components.weather import (
    WeatherEntityFeature,
)
from homeassistant.const import (
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import HomeAssistant, State, callback
from homeassistant.util import dt as dt_util

from .const import (
    AGGREGATION_MAX,
    AGGREGATION_MEDIAN,
    AGGREGATION_MIN,
)

_LOGGER = logging.getLogger(__name__)

FORECAST_KEY = "forecast"
FORECAST_TEMP_KEY = "temperature"


def _state_value(state: State | None) -> float | None:
    if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
        return None
    try:
        value = float(state.state)
    except ValueError:
        return None
    return value if value == value else None  # reject NaN


def aggregate_values(values: list[float], mode: str) -> float | None:
    """Aggregate a list of readings with mean/median/min/max."""
    if not values:
        return None
    if mode == AGGREGATION_MEDIAN:
        return float(median(values))
    if mode == AGGREGATION_MIN:
        return min(values)
    if mode == AGGREGATION_MAX:
        return max(values)
    return sum(values) / len(values)


@dataclass(slots=True)
class ZoneSensors:
    """Aggregated temperature (and humidity) for one zone."""

    hass: HomeAssistant
    entity_ids: tuple[str, ...]
    mode: str
    stale_after: int
    humidity_entity_id: str | None = None
    _last_values: dict[str, float] | None = None
    _last_seen: dict[str, datetime] | None = None

    def _readings(self) -> list[float]:
        now = dt_util.utcnow()
        values: list[float] = []
        seen: dict[str, datetime] = {}
        for entity_id in self.entity_ids:
            state = self.hass.states.get(entity_id)
            value = _state_value(state)
            if value is None:
                continue
            last_updated = state.last_updated or now
            stale = (now - last_updated).total_seconds() > self.stale_after
            if self.stale_after > 0 and stale:
                _LOGGER.debug("Ignoring stale sensor %s", entity_id)
                continue
            values.append(value)
            seen[entity_id] = last_updated
        self._last_values = dict(
            zip(self.entity_ids, values, strict=False)
        )
        self._last_seen = seen
        return values

    def temperature(self) -> float | None:
        return aggregate_values(self._readings(), self.mode)

    def humidity(self) -> float | None:
        if not self.humidity_entity_id:
            return None
        return _state_value(self.hass.states.get(self.humidity_entity_id))

    @property
    def contributing_sensors(self) -> tuple[str, ...]:
        if not self._last_seen:
            return ()
        return tuple(self._last_seen)


@dataclass(slots=True)
class OutdoorSource:
    """Outdoor temperature with a fallback chain: sensor -> weather current -> forecast.

    ``entity_id`` may point at a ``sensor.*`` (temperature) or a ``weather.*``
    entity. Weather entities are queried for the current temperature, and, if
    that fails, for the first hourly forecast slot.
    """

    hass: HomeAssistant
    entity_id: str | None
    _last_good: float | None = None
    _last_good_at: datetime | None = None

    async def async_read(self) -> float | None:
        """Read the outdoor temperature, trying each fallback in order."""
        if not self.entity_id:
            return None
        state = self.hass.states.get(self.entity_id)
        if state is not None:
            if state.domain == "sensor":
                value = _state_value(state)
                if value is not None:
                    self._remember(value)
                    return value
            elif state.domain == WEATHER_DOMAIN:
                value = _state_value_attributes(state, "temperature")
                if value is not None:
                    self._remember(value)
                    return value
                value = await self._async_forecast_temperature(self.entity_id)
                if value is not None:
                    self._remember(value)
                    return value
        # Nothing worked: reuse the last good value if recent enough.
        if self._last_good is not None and self._last_good_at is not None:
            age = (dt_util.utcnow() - self._last_good_at).total_seconds()
            if age < 6 * 3600:
                _LOGGER.debug(
                    "Outdoor source %s unavailable, "
                    "reusing last good value (%.0fs old)",
                    self.entity_id,
                    age,
                )
                return self._last_good
        return None

    def _remember(self, value: float) -> None:
        self._last_good = value
        self._last_good_at = dt_util.utcnow()

    async def _async_forecast_temperature(self, entity_id: str) -> float | None:
        """Ask the weather entity for its next hourly forecast temperature."""
        state = self.hass.states.get(entity_id)
        if state is None:
            return None
        features = int(state.attributes.get("supported_features", 0) or 0)
        if not features & WeatherEntityFeature.FORECAST_HOURLY:
            return None
        try:
            response = await self.hass.services.async_call(
                WEATHER_DOMAIN,
                "get_forecasts",
                {"type": "hourly"},
                target={"entity_id": entity_id},
                blocking=True,
                return_response=True,
            )
        except Exception:  # noqa: BLE001 - service call may fail for many reasons
            _LOGGER.debug(
                "weather.get_forecasts failed for %s", entity_id, exc_info=True
            )
            return None
        forecast = (response or {}).get(entity_id, {}).get(FORECAST_KEY, [])
        if not forecast:
            return None
        first = forecast[0]
        temp = first.get(FORECAST_TEMP_KEY)
        if temp is None:
            return None
        try:
            return float(temp)
        except (TypeError, ValueError):
            return None

    @callback
    def available(self) -> bool:
        if not self.entity_id:
            return False
        state = self.hass.states.get(self.entity_id)
        return state is not None and state.state not in (
            STATE_UNAVAILABLE,
            STATE_UNKNOWN,
        )


def _state_value_attributes(state: State, key: str) -> float | None:
    value = state.attributes.get(key)
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def stale_after_timedelta(stale_after: int) -> timedelta:
    return timedelta(seconds=stale_after)
