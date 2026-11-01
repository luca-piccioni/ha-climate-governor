"""Switch entities for Climate Governor: zone enable/boost + master heat/cool."""

from typing import override

from homeassistant.components.switch import SwitchEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import CONF_MASTER_COOL, CONF_MASTER_HEAT
from .coordinator import ClimateGovernorConfigEntry, GovernorCoordinator, ZoneRuntime
from .entity import GovernorGatewayEntity, GovernorZoneEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ClimateGovernorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add master switches (entry-level) and per-zone enable/boost switches."""
    coordinator = entry.runtime_data
    async_add_entities(
        [
            MasterSwitch(coordinator, CONF_MASTER_HEAT, "master_heat"),
            MasterSwitch(coordinator, CONF_MASTER_COOL, "master_cool"),
        ]
    )
    for zone_id, runtime in coordinator.zones.items():
        async_add_entities(
            [
                ZoneEnableSwitch(coordinator, runtime),
                ZoneBoostSwitch(coordinator, runtime),
            ],
            config_subentry_id=zone_id,
        )


class ZoneEnableSwitch(GovernorZoneEntity, SwitchEntity):
    """Enable or disable one zone."""

    _attr_translation_key = "zone_enable"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the switch."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-enable"
        )

    @property
    @override
    def is_on(self) -> bool:
        return self._runtime.user.enabled

    @override
    async def async_turn_on(self, **kwargs: object) -> None:
        self.coordinator.async_set_user(self._zone_subentry_id, enabled=True)

    @override
    async def async_turn_off(self, **kwargs: object) -> None:
        self.coordinator.async_set_user(self._zone_subentry_id, enabled=False)


class ZoneBoostSwitch(GovernorZoneEntity, SwitchEntity):
    """Force the boost preset while on."""

    _attr_translation_key = "boost"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(
        self, coordinator: GovernorCoordinator, runtime: ZoneRuntime
    ) -> None:
        """Initialize the switch."""
        super().__init__(coordinator, runtime)
        self._attr_unique_id = (
            f"{coordinator.config_entry.entry_id}-zone-{runtime.spec.subentry_id}"
            "-boost"
        )

    @property
    @override
    def is_on(self) -> bool:
        return self._runtime.user.boost

    @override
    async def async_turn_on(self, **kwargs: object) -> None:
        self.coordinator.async_set_user(self._zone_subentry_id, boost=True)

    @override
    async def async_turn_off(self, **kwargs: object) -> None:
        self.coordinator.async_set_user(self._zone_subentry_id, boost=False)


class MasterSwitch(GovernorGatewayEntity, SwitchEntity):
    """Entry-level master enable for the heating or cooling path."""

    _attr_entity_category = EntityCategory.CONFIG

    def __init__(
        self, coordinator: GovernorCoordinator, which: str, translation_key: str
    ) -> None:
        """Initialize the master switch."""
        super().__init__(coordinator)
        self._which = which
        self._attr_translation_key = translation_key
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}-{which}"

    @property
    @override
    def is_on(self) -> bool:
        if self._which == CONF_MASTER_HEAT:
            return self.coordinator.master_heat
        return self.coordinator.master_cool

    @override
    async def async_turn_on(self, **kwargs: object) -> None:
        self.coordinator.async_set_master(self._which, True)

    @override
    async def async_turn_off(self, **kwargs: object) -> None:
        self.coordinator.async_set_master(self._which, False)
