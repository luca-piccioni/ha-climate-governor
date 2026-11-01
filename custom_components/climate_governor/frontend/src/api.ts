import type { Hass, OverviewPayload } from "./types";

export const DOMAIN = "climate_governor";

export async function fetchOverview(hass: Hass): Promise<OverviewPayload> {
  return (await hass.connection.sendMessagePromise({
    type: "climate_governor/overview",
  })) as OverviewPayload;
}

export async function deleteSubentry(
  hass: Hass,
  entryId: string,
  subentryId: string,
): Promise<void> {
  await hass.connection.sendMessagePromise({
    type: "config_entries/subentries/delete",
    entry_id: entryId,
    subentry_id: subentryId,
  });
}

export async function callService(
  hass: Hass,
  domain: string,
  service: string,
  data: Record<string, unknown>,
): Promise<void> {
  await hass.connection.sendMessagePromise({
    type: "call_service",
    domain,
    service,
    service_data: data,
  });
}

// Internal navigation within the panel. HA's router keeps hass.panelUrl in
// sync when we pushState + fire location-changed (same as core panels).
export function navigate(hass: Hass, path: string): void {
  const url = `/climate-governor${path}`;
  if (window.location.pathname === url) {
    return;
  }
  history.pushState(null, "", url);
  window.dispatchEvent(new CustomEvent("location-changed"));
  void hass;
}

// Delegate add/edit to core's integration page, which owns the subentry flow
// (validation, selectors, translations). One source of truth.
export function openCoreEntryPage(entryId: string): void {
  history.pushState(
    null,
    "",
    `/config/integrations/integration/${DOMAIN}#config_entry=${entryId}`,
  );
  window.dispatchEvent(new CustomEvent("location-changed"));
}
