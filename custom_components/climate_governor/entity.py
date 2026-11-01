"""Shared entity bases for Climate Governor platforms."""

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .coordinator import GovernorCoordinator, ZoneRuntime


class GovernorZoneEntity(CoordinatorEntity[GovernorCoordinator]):
    """Base for entities scoped to one zone subentry (attached to zone device)."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: GovernorCoordinator, runtime: ZoneRuntime) -> None:
        """Initialize and bind to the zone runtime."""
        super().__init__(coordinator)
        self._runtime = runtime
        self._zone_subentry_id = runtime.spec.subentry_id

    @property
    def device_info(self) -> DeviceInfo:
        return self.coordinator.async_device_info(self._runtime)  # type: ignore[return-value]

    @property
    def available(self) -> bool:
        return self.coordinator.last_update_success


class GovernorGatewayEntity(CoordinatorEntity[GovernorCoordinator]):
    """Base for entry-level entities (attached to the gateway device)."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: GovernorCoordinator) -> None:
        """Initialize and bind to the coordinator."""
        super().__init__(coordinator)

    @property
    def device_info(self) -> DeviceInfo:
        return self.coordinator.async_gateway_device_info()  # type: ignore[return-value]

    @property
    def available(self) -> bool:
        return self.coordinator.last_update_success
