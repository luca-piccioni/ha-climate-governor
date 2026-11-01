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

// Inline writes go through the CONFIG-category entities (number/switch/select/
// button), which already persist into the coordinator's per-zone user config.
// No parallel write API — one source of truth.
export const setNumber = (hass: Hass, entity_id: string, value: number) =>
  callService(hass, "number", "set_value", { entity_id, value });

export const selectOption = (hass: Hass, entity_id: string, option: string) =>
  callService(hass, "select", "select_option", { entity_id, option });

export const setSwitch = (hass: Hass, entity_id: string, on: boolean) =>
  callService(hass, "switch", on ? "turn_on" : "turn_off", { entity_id });

export const pressButton = (hass: Hass, entity_id: string) =>
  callService(hass, "button", "press", { entity_id });

export interface HistoryPoint {
  t: number; // epoch ms
  v: number;
}

// Last `hours` of an entity's numeric history, for the zone sparkline.
// Returns [] when the recorder is unavailable or the entity has no history.
export async function fetchHistory(
  hass: Hass,
  entity_id: string,
  hours = 24,
): Promise<HistoryPoint[]> {
  const start = new Date(Date.now() - hours * 3600_000).toISOString();
  try {
    const resp = (await hass.connection.sendMessagePromise({
      type: "history/history_during_period",
      start_time: start,
      entity_ids: [entity_id],
      significant_changes_only: false,
      minimal_response: true,
      no_attributes: true,
    })) as Record<
      string,
      { state: string; last_changed: string; last_updated?: string }[]
    >;
    const rows = resp?.[entity_id] ?? [];
    const pts: HistoryPoint[] = [];
    for (const r of rows) {
      const v = Number(r.state);
      if (Number.isFinite(v)) {
        pts.push({ t: Date.parse(r.last_changed), v });
      }
    }
    return pts;
  } catch {
    return [];
  }
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
