import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "./styles";
import {
  deleteSubentry,
  fetchHistory,
  fetchOverview,
  navigate,
  openCoreEntryPage,
  pressButton,
  selectOption,
  setNumber,
  setSwitch,
  type HistoryPoint,
} from "./api";
import type {
  Hass,
  OverviewPayload,
  PanelRouter,
  PeriodInfo,
  ZoneInfo,
} from "./types";

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
  // Reactive (state:true, no attribute reflection): HA assigns a fresh `hass`
  // object on every state change and a new `route` on navigation, so these
  // must be reactive for the panel to update live and switch views.
  @property({ state: true }) hass!: Hass;
  @property({ state: true }) narrow = false;
  @property({ state: true }) route!: PanelRouter;
  @property({ state: true }) panel!: { url_path: string };

  @state() private _data: OverviewPayload | null = null;
  @state() private _loading = true;
  @state() private _error: string | null = null;
  // entity_id -> recent history points, for the zone-detail sparkline.
  @state() private _history: Record<string, HistoryPoint[]> = {};

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
      if (zone) {
        this._maybeFetchHistory(zone);
        view = this._renderZoneDetail(zone, data);
      } else {
        view = this._renderZones(data);
      }
    } else if (path.startsWith("/zones")) {
      view = this._renderZones(data);
    } else if (path.startsWith("/periods")) {
      view = this._renderPeriods(data);
    } else {
      view = this._renderOverview(data);
    }

    return html`${this._header(data.entry.title)}${this._tabs(path)}<main>${view}</main>`;
  }

  // Fetch 24h history for the zone's climate + duty-cycle once per entity.
  // Fire-and-forget; the reactive _history map re-renders the sparkline.
  private _maybeFetchHistory(zone: ZoneInfo): void {
    const ids = [zone.entities.climate, zone.entities.duty_cycle].filter(
      (id): id is string => Boolean(id) && !(id in this._history),
    );
    for (const id of ids) {
      this._history[id] = []; // mark in-flight so we don't refetch each render
      void fetchHistory(this.hass, id).then((pts) => {
        this._history = { ...this._history, [id]: pts };
      });
    }
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
            ${this._sparkline(z)}
          </div>

          ${this._renderControls(z)}`
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

  // ---- Inline controls (write via CONFIG entities) ------------------------

  private _renderControls(z: ZoneInfo) {
    const e = z.entities;
    const enableState = e.zone_enable ? this.hass.states[e.zone_enable] : undefined;
    const boostState = e.boost ? this.hass.states[e.boost] : undefined;
    const holdState = e.preset_hold ? this.hass.states[e.preset_hold] : undefined;

    return html`<div class="card section" style="cursor:default">
      <div class="card-title">Controls</div>
      <div class="controls">
        ${e.zone_enable
          ? this._toggle(
              "Enabled",
              enableState?.state === "on",
              (on) => void setSwitch(this.hass, e.zone_enable, on),
            )
          : nothing}
        ${e.boost
          ? this._toggle(
              "Boost",
              boostState?.state === "on",
              (on) => void setSwitch(this.hass, e.boost, on),
            )
          : nothing}
        ${e.preset_hold
          ? this._select(
              "Preset hold",
              holdState?.state ?? "schedule",
              (holdState?.attributes?.options as string[]) ??
                Object.keys(this._data?.presets ?? {}),
              (opt) => void selectOption(this.hass, e.preset_hold, opt),
            )
          : nothing}
        ${e.tolerance
          ? this._number(
              "Tolerance",
              e.tolerance,
              (v) => void setNumber(this.hass, e.tolerance, v),
            )
          : nothing}
        ${e.kp
          ? this._number("Kp", e.kp, (v) => void setNumber(this.hass, e.kp, v))
          : nothing}
        ${e.ki
          ? this._number("Ki", e.ki, (v) => void setNumber(this.hass, e.ki, v))
          : nothing}
        ${e.setpoint_offset
          ? this._number(
              "Offset",
              e.setpoint_offset,
              (v) => void setNumber(this.hass, e.setpoint_offset, v),
            )
          : nothing}
      </div>
      <div class="actions" style="margin-top:14px">
        ${e.reset_integral
          ? html`<button
              class="secondary"
              @click=${() => void pressButton(this.hass, e.reset_integral)}
            >
              <ha-icon icon="mdi:restore"></ha-icon> Reset integral
            </button>`
          : nothing}
        ${e.preset_hold && holdState?.state && holdState.state !== "schedule"
          ? html`<button
              class="secondary"
              @click=${() => void selectOption(this.hass, e.preset_hold, "schedule")}
            >
              <ha-icon icon="mdi:calendar-clock"></ha-icon> Release hold
            </button>`
          : nothing}
      </div>
    </div>`;
  }

  private _toggle(
    label: string,
    on: boolean,
    onChange: (on: boolean) => void,
  ) {
    return html`<div class="control">
      <label>${label}</label>
      <span
        class=${`toggle ${on ? "on" : ""}`}
        role="switch"
        aria-checked=${on ? "true" : "false"}
        tabindex="0"
        @click=${() => onChange(!on)}
        @keydown=${(ev: KeyboardEvent) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onChange(!on);
          }
        }}
      >
        <span class="track"></span>
        <span>${on ? "On" : "Off"}</span>
      </span>
    </div>`;
  }

  private _number(
    label: string,
    entity_id: string,
    onCommit: (v: number) => void,
  ) {
    const st = this.hass.states[entity_id];
    if (!st) return nothing;
    const attrs = st.attributes as { min?: number; max?: number; step?: number };
    const value = Number(st.state);
    return html`<div class="control">
      <label>${label}</label>
      <input
        type="number"
        .value=${String(Number.isFinite(value) ? value : "")}
        min=${attrs.min ?? ""}
        max=${attrs.max ?? ""}
        step=${attrs.step ?? "any"}
        @change=${(ev: Event) => {
          const v = Number((ev.target as HTMLInputElement).value);
          if (Number.isFinite(v)) onCommit(v);
        }}
      />
    </div>`;
  }

  private _select(
    label: string,
    current: string,
    options: string[],
    onCommit: (v: string) => void,
  ) {
    return html`<div class="control">
      <label>${label}</label>
      <select
        @change=${(ev: Event) =>
          onCommit((ev.target as HTMLSelectElement).value)}
      >
        ${options.map(
          (o) =>
            html`<option value=${o} ?selected=${o === current}>${o}</option>`,
        )}
      </select>
    </div>`;
  }

  // ---- Sparkline ----------------------------------------------------------

  private _sparkline(z: ZoneInfo) {
    const pts = this._history[z.entities.duty_cycle] ?? [];
    if (pts.length < 2) return nothing;
    const w = 300;
    const h = 60;
    const t0 = pts[0].t;
    const t1 = pts[pts.length - 1].t || t0 + 1;
    const vs = pts.map((p) => p.v);
    const vMin = Math.min(...vs, 0);
    const vMax = Math.max(...vs, 1);
    const span = vMax - vMin || 1;
    const poly = pts
      .map(
        (p) =>
          `${(((p.t - t0) / (t1 - t0)) * w).toFixed(1)},${(
            h -
            ((p.v - vMin) / span) * h
          ).toFixed(1)}`,
      )
      .join(" ");
    return html`<div class="control" style="margin-top:10px">
      <label>Duty cycle · 24h</label>
      <svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <polyline points=${poly} />
      </svg>
    </div>`;
  }

  // ---- Periods (week grid) ------------------------------------------------

  private _renderPeriods(data: OverviewPayload) {
    const zoneName = (id: string) =>
      data.zones.find((z) => z.subentry_id === id)?.name ?? id;
    return html`
      <h2>Schedule</h2>
      <div class="actions">
        <button @click=${() => openCoreEntryPage(data.entry!.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add period
        </button>
      </div>
      ${data.periods.length === 0
        ? html`<p class="empty">No schedule periods yet.</p>`
        : html`
            ${this._weekGrid(data.periods)}
            <div class="card section" style="cursor:default; overflow-x:auto">
              <table class="week">
                <thead>
                  <tr>
                    <th>Period</th><th>Time</th><th>Preset</th><th>Zones</th>
                    <th>Days</th>
                  </tr>
                </thead>
                <tbody>
                  ${[...data.periods]
                    .sort((a, b) =>
                      (a.from_time ?? "").localeCompare(b.from_time ?? ""),
                    )
                    .map(
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
            </div>
          `}
    `;
  }

  // A 7-column week grid; each period appears in the cells for its days.
  // Time is shown inside the chip (rows would need real time-bucketing, which
  // the schedule model does not fix — periods are arbitrary ranges).
  private _weekGrid(periods: PeriodInfo[]) {
    return html`<div class="weekgrid">
      <div class="head"></div>
      ${DAY_NAMES.map((d) => html`<div class="head">${d}</div>`)}
      <div class="head">All</div>
      ${DAY_NAMES.map((_, day) => {
        const onDay = periods.filter((p) => p.days.includes(day));
        return html`<div class="cell">
          ${onDay.length === 0
            ? html`<span class="muted">—</span>`
            : onDay.map(
                (p) =>
                  html`<span class="p"
                    >${p.from_time?.slice(0, 5)}–${p.to_time?.slice(0, 5)}
                    ${p.preset}</span
                  >`,
              )}
        </div>`;
      })}
    </div>`;
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
