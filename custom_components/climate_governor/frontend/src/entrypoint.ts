import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "./styles";
import {
  deleteSubentry,
  fetchDiagnostics,
  fetchHistory,
  fetchOverview,
  navigate,
  openCoreEntryPage,
  pressButton,
  selectOption,
  setNumber,
  setSwitch,
  updateOptions,
  type HistoryPoint,
} from "./api";
import type {
  Bounds,
  DiagnosticsPayload,
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
  // Lazily fetched on the diagnostics view.
  @state() private _diagnostics: DiagnosticsPayload | null = null;
  @state() private _diagLoading = false;
  // Edit buffers for the presets / tuning forms. Kept local so a Save commits
  // one options update (and one reload) instead of one per keystroke. Reset on
  // navigation and after a successful save so the next entry re-reads fresh data.
  @state() private _presetEdits: Record<string, { heat: number; cool: number }> | null =
    null;
  @state() private _defaultPresetEdit: string | null = null;
  @state() private _tuningEdits: Record<string, number> | null = null;
  @state() private _saving = false;
  @state() private _saved = false;

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
    // Leaving a form view: drop any uncommitted edits so the next entry
    // re-reads from freshly fetched data.
    this._presetEdits = null;
    this._defaultPresetEdit = null;
    this._tuningEdits = null;
    this._saved = false;
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
    } else if (path.startsWith("/presets")) {
      view = this._renderPresets(data);
    } else if (path.startsWith("/tuning")) {
      view = this._renderTuning(data);
    } else if (path.startsWith("/diagnostics")) {
      this._maybeFetchDiagnostics();
      view = this._renderDiagnostics();
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
      ${tab("/presets", "Presets")}${tab("/tuning", "Tuning")}
      ${tab("/diagnostics", "Diagnostics")}
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

  // ---- Shared form helpers ------------------------------------------------

  // A labeled number input bound to a bounds tuple; commits to a local buffer
  // on change (blur/enter), never per keystroke. The Save button persists.
  private _numInput(
    value: number | undefined,
    bounds: Bounds | undefined,
    onCommit: (v: number) => void,
  ) {
    const min = bounds?.[0];
    const max = bounds?.[1];
    const step = bounds?.[2];
    return html`<input
      type="number"
      .value=${value != null ? String(value) : ""}
      min=${min ?? ""}
      max=${max ?? ""}
      step=${step ?? "any"}
      @change=${(ev: Event) => {
        const raw = Number((ev.target as HTMLInputElement).value);
        if (Number.isFinite(raw)) onCommit(raw);
      }}
    />`;
  }

  private _saveNote() {
    if (this._saving) return html`<span class="muted">Saving…</span>`;
    if (this._saved) return html`<span class="muted">Saved.</span>`;
    return nothing;
  }

  // ---- Presets (heat/cool setpoint matrix) --------------------------------

  private _presetKeys(data: OverviewPayload): string[] {
    return data.preset_keys ?? Object.keys(data.presets ?? {});
  }

  private _currentPresetEdits(
    data: OverviewPayload,
    keys: string[],
  ): Record<string, { heat: number; cool: number }> {
    if (this._presetEdits) return this._presetEdits;
    const out: Record<string, { heat: number; cool: number }> = {};
    for (const k of keys) {
      const p = data.presets?.[k] ?? {};
      out[k] = { heat: p.heat ?? 0, cool: p.cool ?? 0 };
    }
    return out;
  }

  private _renderPresets(data: OverviewPayload) {
    const keys = this._presetKeys(data);
    const edits = this._currentPresetEdits(data, keys);
    const limits = data.limits;
    const presetOptions = Object.keys(data.presets ?? {});
    const currentDefault = this._defaultPresetEdit ?? data.default_preset ?? "";

    return html`
      <h2>Presets</h2>
      <p class="muted">
        Setpoints per preset. Heat is used when heating, cool when cooling.
        Values are saved together.
      </p>
      <div class="card section" style="cursor:default; overflow-x:auto">
        <table class="matrix">
          <thead>
            <tr>
              <th>Preset</th>
              <th>Heat <span class="muted">(°C)</span></th>
              <th>Cool <span class="muted">(°C)</span></th>
            </tr>
          </thead>
          <tbody>
            ${keys.map(
              (k) => html`<tr>
                <td>
                  <span class="chip ${k === currentDefault ? "on" : ""}">${k}</span>
                </td>
                <td>
                  ${this._numInput(edits[k]?.heat, limits?.preset_heat, (v) => {
                    this._presetEdits = {
                      ...edits,
                      [k]: { ...edits[k], heat: v },
                    };
                    this._saved = false;
                  })}
                </td>
                <td>
                  ${this._numInput(edits[k]?.cool, limits?.preset_cool, (v) => {
                    this._presetEdits = {
                      ...edits,
                      [k]: { ...edits[k], cool: v },
                    };
                    this._saved = false;
                  })}
                </td>
              </tr>`,
            )}
          </tbody>
        </table>
      </div>

      <div class="card section" style="cursor:default">
        <div class="controls">
          ${this._select(
            "Default preset",
            currentDefault,
            presetOptions.length ? presetOptions : keys,
            (opt) => {
              this._defaultPresetEdit = opt;
              this._saved = false;
            },
          )}
        </div>
      </div>

      <div class="actions">
        <button
          ?disabled=${this._saving}
          @click=${() => void this._savePresets(data, keys)}
        >
          <ha-icon icon="mdi:content-save"></ha-icon> Save presets
        </button>
        ${this._saveNote()}
      </div>
    `;
  }

  private async _savePresets(data: OverviewPayload, keys: string[]) {
    const edits = this._currentPresetEdits(data, keys);
    const presets: Record<string, { heat: number; cool: number }> = {};
    for (const k of keys) presets[k] = edits[k];
    this._saving = true;
    this._saved = false;
    try {
      await updateOptions(this.hass, data.entry!.entry_id, {
        presets,
        default_preset: this._defaultPresetEdit ?? data.default_preset,
      });
      this._presetEdits = null;
      this._defaultPresetEdit = null;
      this._saved = true;
      await this._load();
    } catch (err) {
      window.alert(`Save failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      this._saving = false;
    }
  }

  // ---- Tuning (season, master switches, global control defaults) ----------

  private _renderTuning(data: OverviewPayload) {
    const gw = data.gateway_entities ?? {};
    const seasonState = gw.season ? this.hass.states[gw.season] : undefined;
    const season = seasonState?.state ?? data.season ?? "";
    const seasonOptions =
      (seasonState?.attributes?.options as string[]) ??
      data.season_options ??
      ["heating", "shoulder", "cooling"];

    const heatState = gw.master_heat ? this.hass.states[gw.master_heat] : undefined;
    const coolState = gw.master_cool ? this.hass.states[gw.master_cool] : undefined;

    const limits = data.limits?.tuning ?? {};
    const tuning = this._tuningEdits ?? data.tuning ?? {};
    const labels: Record<string, string> = {
      tolerance: "Tolerance",
      kp: "Kp (proportional)",
      ki: "Ki (integral)",
      max_offset: "Max offset",
      cycle_window: "Cycle window (s)",
    };

    return html`
      <h2>Tuning</h2>

      <div class="card section" style="cursor:default">
        <div class="card-title">Season &amp; master switches</div>
        <div class="controls">
          ${gw.season
            ? this._select("Season", season, seasonOptions, (opt) =>
                void selectOption(this.hass, gw.season, opt),
              )
            : nothing}
          ${gw.master_heat
            ? this._toggle(
                "Master heating",
                heatState?.state === "on",
                (on) => void setSwitch(this.hass, gw.master_heat, on),
              )
            : nothing}
          ${gw.master_cool
            ? this._toggle(
                "Master cooling",
                coolState?.state === "on",
                (on) => void setSwitch(this.hass, gw.master_cool, on),
              )
            : nothing}
        </div>
        <p class="muted" style="margin-top:10px">
          The season scales gains, tolerance and outdoor reset. Master switches
          enable or disable the whole heating / cooling path.
        </p>
      </div>

      <div class="card section" style="cursor:default">
        <div class="card-title">Global control defaults</div>
        <p class="muted">
          Defaults for every zone. A zone can override these on its own page.
        </p>
        <div class="controls">
          ${Object.keys(labels).map(
            (key) => html`<div class="control">
              <label>${labels[key]}</label>
              ${this._numInput(tuning[key], limits[key], (v) => {
                this._tuningEdits = { ...(this._tuningEdits ?? tuning), [key]: v };
                this._saved = false;
              })}
            </div>`,
          )}
        </div>
        <div class="actions" style="margin-top:14px">
          <button
            ?disabled=${this._saving}
            @click=${() => void this._saveTuning(data)}
          >
            <ha-icon icon="mdi:content-save"></ha-icon> Save defaults
          </button>
          ${this._saveNote()}
        </div>
      </div>
    `;
  }

  private async _saveTuning(data: OverviewPayload) {
    const tuning = this._tuningEdits ?? data.tuning ?? {};
    this._saving = true;
    this._saved = false;
    try {
      await updateOptions(this.hass, data.entry!.entry_id, { tuning });
      this._tuningEdits = null;
      this._saved = true;
      await this._load();
    } catch (err) {
      window.alert(`Save failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      this._saving = false;
    }
  }

  // ---- Diagnostics --------------------------------------------------------

  private _maybeFetchDiagnostics(): void {
    if (this._diagnostics || this._diagLoading) return;
    this._diagLoading = true;
    void fetchDiagnostics(this.hass)
      .then((d) => {
        this._diagnostics = d;
      })
      .catch(() => {
        this._diagnostics = { diagnostics: null, issues: [] };
      })
      .finally(() => {
        this._diagLoading = false;
      });
  }

  private _renderDiagnostics() {
    if (this._diagLoading && !this._diagnostics) {
      return html`<h2>Diagnostics</h2><p class="muted">Loading…</p>`;
    }
    const d = this._diagnostics;
    if (!d) return html`<h2>Diagnostics</h2><p class="muted">No data.</p>`;

    const issues = d.issues ?? [];
    const diag = d.diagnostics as
      | {
          config?: Record<string, unknown>;
          options?: Record<string, unknown>;
          outdoor_temp?: number | null;
          master_heat?: boolean;
          master_cool?: boolean;
          zones?: Record<string, Record<string, unknown>>;
        }
      | null;

    return html`
      <h2>Diagnostics</h2>
      <div class="actions">
        <button
          class="secondary"
          @click=${() => {
            this._diagnostics = null;
            this._maybeFetchDiagnostics();
          }}
        >
          <ha-icon icon="mdi:refresh"></ha-icon> Refresh
        </button>
      </div>

      <div class="section">
        <h2>Issues</h2>
        ${issues.length === 0
          ? html`<p class="empty">No open issues. 🎉</p>`
          : html`<div class="grid">
              ${issues.map(
                (i) => html`<div class="card" style="cursor:default">
                  <div class="card-title">
                    <ha-icon
                      icon=${i.severity === "error"
                        ? "mdi:alert-octagon"
                        : "mdi:alert"}
                    ></ha-icon>
                    ${i.translation_key ?? i.issue_id}
                  </div>
                  <div class="chips">
                    <span class="chip ${i.severity === "error" ? "off" : "warn"}">
                      ${i.severity ?? "issue"}
                    </span>
                    ${Object.entries(i.translation_placeholders ?? {}).map(
                      ([k, v]) => html`<span class="chip">${k}: ${String(v)}</span>`,
                    )}
                  </div>
                </div>`,
              )}
            </div>`}
      </div>

      ${diag
        ? html`
            <div class="card section" style="cursor:default">
              <div class="card-title">System</div>
              <dl class="kv">
                <dt>Name</dt>
                <dd>${String(diag.config?.name ?? "—")}</dd>
                <dt>Outdoor source</dt>
                <dd>${String(diag.config?.outdoor_entity_id ?? "—")}</dd>
                <dt>Outdoor temp</dt>
                <dd>${diag.outdoor_temp ?? "—"}</dd>
                <dt>Design temp</dt>
                <dd>${String(diag.config?.outdoor_design_temp ?? "—")}</dd>
                <dt>Season</dt>
                <dd>${String(diag.options?.season ?? "—")}</dd>
                <dt>Master heat / cool</dt>
                <dd>${diag.master_heat ? "on" : "off"} / ${diag.master_cool ? "on" : "off"}</dd>
              </dl>
            </div>

            <div class="section">
              <h2>Zones</h2>
              <div class="grid">
                ${Object.entries(diag.zones ?? {}).map(([id, z]) => {
                  const st = (z.state ?? {}) as Record<string, unknown>;
                  const acts = (z.actuators ?? []) as {
                    entity_id: string;
                    kind: string;
                    role: string;
                    capabilities?: string;
                  }[];
                  return html`<div class="card" style="cursor:default">
                    <div class="card-title">${String(z.name ?? id)}</div>
                    <div class="stat-row">
                      ${this._stat("Action", String(st.action ?? "—"))}
                      ${this._stat(
                        "Duty",
                        st.duty_cycle != null ? `${st.duty_cycle}%` : "—",
                      )}
                      ${this._stat("Integral", String(st.integral ?? "—"))}
                    </div>
                    <div class="chips">
                      ${acts.map(
                        (a) =>
                          html`<span class="chip">${a.entity_id} (${a.role}/${a.kind})</span>`,
                      )}
                    </div>
                  </div>`;
                })}
              </div>
            </div>

            <details class="section">
              <summary class="muted">Raw diagnostics JSON</summary>
              <pre class="json">${JSON.stringify(diag, null, 2)}</pre>
            </details>
          `
        : html`<p class="empty">Entry not loaded — no live diagnostics.</p>`}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "climate-governor-panel": ClimateGovernorPanel;
  }
}
