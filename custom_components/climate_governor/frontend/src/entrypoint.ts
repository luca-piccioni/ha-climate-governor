import { LitElement, html, nothing, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "./styles";
import {
  deleteSubentry,
  fetchOverview,
  navigate,
  openCoreEntryPage,
} from "./api";
import type { Hass, OverviewPayload, PanelRouter, ZoneInfo } from "./types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const HVAC_ACTION_ICON: Record<string, string> = {
  heating: "mdi:fire",
  cooling: "mdi:snowflake",
  idle: "mdi:power",
  off: "mdi:power-off",
  fan: "mdi:fan",
  defrosting: "mdi:snowflake-melt",
  drying: "mdi:weather-sunny",
  preheating: "mdi:fire",
};

@customElement("climate-governor-panel")
export class ClimateGovernorPanel extends LitElement {
  public hass!: Hass;
  public narrow = false;
  public route!: PanelRouter;
  public panel!: { url_path: string };

  @state() private _data: OverviewPayload | null = null;
  @state() private _loading = true;
  @state() private _error: string | null = null;

  private _timer?: number;

  static override styles = sharedStyles;

  protected override async firstUpdated(): Promise<void> {
    await this._load();
    // Periodic refresh so schedule-driven changes (preset, next change) settle
    // even without a state-change; live values re-render from hass.states.
    this._timer = window.setInterval(() => void this._load(), 30_000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer) window.clearInterval(this._timer);
  }

  protected override updated(changed: PropertyValues): void {
    // Re-render on hass identity change (states) — handled by Lit reactive
    // props. When the route changes, Lit re-renders via the route property.
    if (changed.has("route")) {
      this.requestUpdate();
    }
  }

  private async _load(): Promise<void> {
    try {
      this._error = null;
      this._data = await fetchOverview(this.hass);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _sub(path: string): void {
    navigate(this.hass, path);
  }

  private _currentPath(): string {
    // route.path is relative to the panel prefix ("/climate-governor").
    return this.route?.path ?? "";
  }

  protected override render() {
    if (this._loading && !this._data) {
      return html`${this._header("Loading")}<main><p class="muted">Loading…</p></main>`;
    }
    if (this._error) {
      return html`${this._header("Error")}<main>
        <p class="empty">Could not load Climate Governor: ${this._error}</p>
        <div class="actions"><button @click=${() => this._load()}>Retry</button></div>
      </main>`;
    }
    const data = this._data!;
    if (!data.entry) {
      return html`${this._header("Climate Governor")}<main>
        <div class="empty">
          <p>No Climate Governor entry is set up yet.</p>
          <p class="muted">
            Add the integration under
            <strong>Settings → Devices &amp; services</strong> first.
          </p>
        </div>
      </main>`;
    }

    const path = this._currentPath();
    let view;
    if (path.startsWith("/zones/")) {
      const id = decodeURIComponent(path.slice("/zones/".length));
      const zone = data.zones.find((z) => z.subentry_id === id);
      view = zone ? this._renderZoneDetail(zone, data) : this._renderZones(data);
    } else if (path.startsWith("/zones")) {
      view = this._renderZones(data);
    } else if (path.startsWith("/periods")) {
      view = this._renderPeriods(data);
    } else {
      view = this._renderOverview(data);
    }

    return html`${this._header(data.entry.title)}${this._tabs(path)}<main>${view}</main>`;
  }

  private _header(title: string) {
    return html`<header class="app-header">
      ${this.narrow
        ? html`<ha-icon icon="mdi:menu"></ha-icon>`
        : nothing}
      <ha-icon icon="mdi:thermostat"></ha-icon>
      <span class="title">${title}</span>
      <ha-icon
        class="menu"
        icon="mdi:refresh"
        style="cursor:pointer"
        @click=${() => this._load()}
      ></ha-icon>
    </header>`;
  }

  private _tabs(path: string) {
    const tab = (p: string, label: string) => {
      const active =
        (p === "/" && (path === "/" || path === "")) ||
        (p !== "/" && path.startsWith(p));
      return html`<a
        class=${active ? "active" : ""}
        href=${`/climate-governor${p}`}
        @click=${(e: MouseEvent) => {
          e.preventDefault();
          this._sub(p);
        }}
        >${label}</a
      >`;
    };
    return html`<nav class="tabs">
      ${tab("/", "Overview")}${tab("/zones", "Zones")}${tab("/periods", "Schedule")}
    </nav>`;
  }

  // ---- Overview -----------------------------------------------------------

  private _renderOverview(data: OverviewPayload) {
    const zones = data.zones;
    const active = zones.filter((z) => z.state?.active).length;
    const heating = zones.filter((z) => z.state?.action === "heating").length;
    const cooling = zones.filter((z) => z.state?.action === "cooling").length;
    const blocked = zones.filter((z) => z.state?.blocked).length;
    const outdoor =
      data.gateway_entities?.outdoor_temperature != null
        ? this.hass.states[data.gateway_entities.outdoor_temperature]?.state
        : undefined;

    return html`
      <h2>Overview</h2>
      <div class="grid">
        ${this._statCard("Zones", String(zones.length), "mdi:grid")}
        ${this._statCard("Active", String(active), "mdi:power-plug")}
        ${this._statCard("Heating", String(heating), "mdi:fire")}
        ${this._statCard("Cooling", String(cooling), "mdi:snowflake")}
        ${this._statCard("Blocked", String(blocked), "mdi:alert")}
        ${this._statCard(
          "Outdoor",
          outdoor != null ? `${outdoor}°` : "—",
          "mdi:thermometer",
        )}
      </div>

      <div class="actions section">
        <button @click=${() => openCoreEntryPage(data.entry!.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone / period
        </button>
        <button
          class="secondary"
          @click=${() => openCoreEntryPage(data.entry!.entry_id)}
        >
          <ha-icon icon="mdi:cog"></ha-icon> Configure in core
        </button>
      </div>

      <div class="section">
        <h2>Zones</h2>
        ${zones.length === 0
          ? html`<p class="empty">No zones yet.</p>`
          : html`<div class="grid">
              ${zones.map((z) => this._zoneCard(z, data))}
            </div>`}
      </div>
    `;
  }

  private _statCard(label: string, value: string, icon: string) {
    return html`<div class="card" style="cursor:default">
      <div class="card-title"><ha-icon icon=${icon}></ha-icon>${label}</div>
      <div class="stat"><span class="value">${value}</span></div>
    </div>`;
  }

  private _zoneCard(z: ZoneInfo, data: OverviewPayload) {
    const st = z.state;
    const area = data.areas?.find((a) => a.area_id === z.area_id)?.name;
    return html`<a
      class="card"
      href=${`/climate-governor/zones/${z.subentry_id}`}
      @click=${(e: MouseEvent) => {
        e.preventDefault();
        this._sub(`/zones/${z.subentry_id}`);
      }}
    >
      <div class="card-title">
        <ha-icon
          icon=${st ? HVAC_ACTION_ICON[st.action] ?? "mdi:thermostat" : "mdi:thermostat"}
        ></ha-icon>
        ${z.name}
      </div>
      <div class="subtitle">${area ?? "no area"}</div>
      <div class="stat-row">
        ${this._stat(
          "Now",
          st?.current_temp != null ? `${st.current_temp}°` : "—",
        )}
        ${this._stat(
          "Target",
          st?.target_temp != null ? `${st.target_temp}°` : "—",
        )}
        ${this._stat("Duty", st ? `${Math.round(st.duty_cycle)}%` : "—")}
      </div>
      <div class="chips">
        ${st
          ? html`<span class="chip ${st.active ? "on" : ""}">${st.action}</span>
              ${st.in_comfort ? html`<span class="chip on">in band</span>` : nothing}
              ${st.blocked ? html`<span class="chip off">blocked</span>` : nothing}
              <span class="chip">${st.effective_preset}</span>`
          : html`<span class="chip warn">not loaded</span>`}
      </div>
    </a>`;
  }

  private _stat(label: string, value: string) {
    return html`<div class="stat">
      <span class="value">${value}</span><span class="label">${label}</span>
    </div>`;
  }

  // ---- Zones list ---------------------------------------------------------

  private _renderZones(data: OverviewPayload) {
    return html`
      <h2>Zones</h2>
      <div class="actions">
        <button @click=${() => openCoreEntryPage(data.entry!.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone
        </button>
      </div>
      ${data.zones.length === 0
        ? html`<p class="empty">No zones yet. Add one to get started.</p>`
        : html`<div class="grid">${data.zones.map((z) => this._zoneCard(z, data))}</div>`}
    `;
  }

  // ---- Zone detail (read-only live + config) ------------------------------

  private _renderZoneDetail(z: ZoneInfo, data: OverviewPayload) {
    const st = z.state;
    const area = data.areas?.find((a) => a.area_id === z.area_id)?.name;
    const floor = data.floors?.find((f) => f.floor_id === z.floor_id)?.name;
    const duty = st ? Math.round(st.duty_cycle) : 0;

    return html`
      <button class="back" @click=${() => this._sub("/zones")}>
        <ha-icon icon="mdi:arrow-left"></ha-icon> Zones
      </button>
      <h2>${z.name}</h2>
      <div class="chips" style="margin-bottom:12px">
        ${area ? html`<span class="chip"><ha-icon icon="mdi:map-marker"></ha-icon>${area}</span>` : nothing}
        ${floor ? html`<span class="chip"><ha-icon icon="mdi:office-building"></ha-icon>${floor}</span>` : nothing}
      </div>

      <div class="actions">
        <button @click=${() => openCoreEntryPage(data.entry!.entry_id)}>
          <ha-icon icon="mdi:pencil"></ha-icon> Edit zone (core)
        </button>
        <button
          class="secondary"
          @click=${() => this._confirmDelete(z)}
        >
          <ha-icon icon="mdi:trash-can-outline"></ha-icon> Delete zone
        </button>
      </div>

      ${st
        ? html`<div class="grid">
            ${this._statCard(
              "Current",
              st.current_temp != null ? `${st.current_temp}°` : "—",
              "mdi:thermometer",
            )}
            ${this._statCard(
              "Target",
              st.target_temp != null ? `${st.target_temp}°` : "—",
              "mdi:thermostat",
            )}
            ${this._statCard("Action", st.action, HVAC_ACTION_ICON[st.action] ?? "mdi:power")}
            ${this._statCard("Preset", st.effective_preset, "mdi:bookmark")}
          </div>
          <div class="card section" style="cursor:default">
            <div class="card-title">Duty cycle</div>
            <div class="stat"><span class="value">${duty}%</span></div>
            <div class="bar"><span style="width:${Math.min(100, duty)}%"></span></div>
            <div class="stat-row" style="margin-top:12px">
              ${this._stat("Output", `${Math.round(Math.max(st.output_heat, st.output_cool))}%`)}
              ${this._stat("Integral", st.integral.toFixed(2))}
              ${this._stat(
                "Next change",
                st.next_change ? this._fmtTime(st.next_change) : "—",
              )}
            </div>
          </div>`
        : html`<p class="empty">This zone is not loaded (no live state).</p>`}

      <div class="card section" style="cursor:default">
        <div class="card-title">Configuration</div>
        <dl class="kv">
          <dt>Temp sensors</dt>
          <dd>${z.temperature_sensors.join(", ") || "—"}</dd>
          <dt>Humidity</dt>
          <dd>${z.humidity_sensor ?? "—"}</dd>
          <dt>Actuators</dt>
          <dd>
            ${z.actuators.map((a) => `${a.entity_id} (${a.role}/${a.kind})`).join(", ") ||
            "—"}
          </dd>
          <dt>Aggregation</dt>
          <dd>${z.aggregation ?? "—"}</dd>
          <dt>Overrides</dt>
          <dd>
            ${Object.keys(z.control_overrides).length
              ? Object.entries(z.control_overrides)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ")
              : "—"}
          </dd>
        </dl>
      </div>
    `;
  }

  private async _confirmDelete(z: ZoneInfo) {
    const ok = window.confirm(`Delete zone "${z.name}"? This removes its entities.`);
    if (!ok) return;
    try {
      await deleteSubentry(this.hass, this._data!.entry!.entry_id, z.subentry_id);
      await this._load();
    } catch (err) {
      window.alert(`Delete failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // ---- Periods (week grid) ------------------------------------------------

  private _renderPeriods(data: OverviewPayload) {
    const zoneName = (id: string) =>
      data.zones.find((z) => z.subentry_id === id)?.name ?? id;
    const rows = [...data.periods].sort((a, b) =>
      (a.from_time ?? "").localeCompare(b.from_time ?? ""),
    );
    return html`
      <h2>Schedule</h2>
      <div class="actions">
        <button @click=${() => openCoreEntryPage(data.entry!.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add period
        </button>
      </div>
      ${rows.length === 0
        ? html`<p class="empty">No schedule periods yet.</p>`
        : html`<div class="card" style="cursor:default; overflow-x:auto">
            <table class="week">
              <thead>
                <tr>
                  <th>Period</th><th>Time</th><th>Preset</th><th>Zones</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(
                  (p) => html`<tr>
                    <td>${p.title}</td>
                    <td>${p.from_time ?? "?"}–${p.to_time ?? "?"}</td>
                    <td><span class="chip">${p.preset}</span></td>
                    <td>${p.zones.map(zoneName).join(", ")}</td>
                    <td>${this._dayChips(p.days)}</td>
                  </tr>`,
                )}
              </tbody>
            </table>
          </div>`}
    `;
  }

  private _dayChips(days: number[]) {
    if (days.length === 7) return html`<span class="chip">every day</span>`;
    return html`<div class="chips"
      >${DAY_NAMES.map(
        (name, i) =>
          html`${days.includes(i)
            ? html`<span class="chip on">${name}</span>`
            : nothing}`,
      )}</div
    >`;
  }

  private _fmtTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "climate-governor-panel": ClimateGovernorPanel;
  }
}
