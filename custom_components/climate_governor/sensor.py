"""Diagnostic sensors for Climate Governor."""

from datetime import datetime
from typing import override

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import PERCENTAGE, EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import ClimateGovernorConfigEntry, GovernorCoordinator, ZoneRuntime
from .entity import GovernorGatewayEntity, GovernorZoneEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ClimateGovernorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add diagnostic sensors for every zone plus the outdoor sensor."""
    coordinator = entry.runtime_data
    async_add_entities([OutdoorTempSensor(coordinator)])
    for zone_id, runtime in coordinator.zones.items():
        async_add_entities(
            [
                ZoneDutyCycleSensor(coordinator, runtime),
                ZoneControlOutputSensor(coordinator, runtime),
                ZoneIntegralSensor(coordinator, runtime),
                ZoneNextScheduleChangeSensor(coordinator, runtime),
                ZoneActuatorCapabilitiesSensor(coordinator, runtime),
            ],
            config_subentry_id=zone_id,
        )


class OutdoorTempSensor(GovernorGatewayEntity, SensorEntity):
    """The outdoor temperature used for the reset bias."""

    _attr_translation_key = "outdoor_temperature"
    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: GovernorCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}-outdoor-temp"

    @property
    @override
    def native_value(self) -> float | None:
        return self.coordinator.data.outdoor_temp if self.coordinator.data else None

    @property
    @override
    def native_unit_of_measurement(self) -> str:
        return self.coordinator.temperature_unit


class ZoneDutyCycleSensor(GovernorZoneEntity, SensorEntity):
    """Scheduled duty cycle of the zone's switch actuators."""

    _attr_translation_key = "duty_cycle"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-duty_cycle"
        )

    @property
    @override
    def native_value(self) -> float:
        return self._runtime.state.duty_cycle


class ZoneControlOutputSensor(GovernorZoneEntity, SensorEntity):
    """Current PI output (0..100) for the active direction."""

    _attr_translation_key = "control_output"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-control_output"
        )

    @property
    @override
    def native_value(self) -> float:
        state = self._runtime.state
        return max(state.output_heat, state.output_cool)


class ZoneIntegralSensor(GovernorZoneEntity, SensorEntity):
    """Current integral term (error-hours)."""

    _attr_translation_key = "integral"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-integral"
        )

    @property
    @override
    def native_value(self) -> float:
        return round(self._runtime.state.integral, 3)


class ZoneNextScheduleChangeSensor(GovernorZoneEntity, SensorEntity):
    """When the effective schedule preset changes next."""

    _attr_translation_key = "next_schedule_change"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-next_schedule_change"
        )

    @property
    @override
    def native_value(self) -> datetime | None:
        return self._runtime.state.next_change


class ZoneActuatorCapabilitiesSensor(GovernorZoneEntity, SensorEntity):
    """Probed capabilities of the zone's actuators (diagnostic)."""

    _attr_translation_key = "actuator_capabilities"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-actuator_capabilities"
        )

    @property
    @override
    def native_value(self) -> str:
        return self._runtime.capabilities_summary()
