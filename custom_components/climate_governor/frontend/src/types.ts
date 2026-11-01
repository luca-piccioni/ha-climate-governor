// Minimal typings for the HA objects the panel touches. The real objects are
// provided by the HA frontend at runtime; we only declare what we use.

export interface HassState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
}

export interface HassConnection {
  sendMessagePromise: (msg: Record<string, unknown>) => Promise<unknown>;
}

export interface Hass {
  states: Record<string, HassState>;
  connection: HassConnection;
  panelUrl: string;
  config: { unit_system: Record<string, string> };
  // Changes whenever config entries/subentries change — used as a re-fetch key.
  config_entries?: unknown[];
}

export interface PanelRouter {
  prefix: string;
  path: string;
}

export interface PanelInfo {
  url_path: string;
  title?: string;
  config?: Record<string, unknown>;
}

export interface ActuatorInfo {
  entity_id: string;
  kind: string;
  role: string;
}

export interface ZoneStateInfo {
  hvac_mode: string;
  action: string;
  target_temp: number | null;
  target_temp_low: number | null;
  target_temp_high: number | null;
  current_temp: number | null;
  humidity: number | null;
  output_heat: number;
  output_cool: number;
  duty_cycle: number;
  integral: number;
  schedule_preset: string;
  effective_preset: string;
  next_change: string | null;
  active: boolean;
  blocked: boolean;
  in_comfort: boolean;
  capabilities: string;
  outdoor_temp: number | null;
}

export interface ZoneInfo {
  subentry_id: string;
  title: string;
  name: string;
  area_id: string | null;
  floor_id: string | null;
  temperature_sensors: string[];
  humidity_sensor: string | null;
  actuators: ActuatorInfo[];
  aggregation: string | null;
  control_overrides: Record<string, number>;
  entities: Record<string, string>;
  state: ZoneStateInfo | null;
}

export interface PeriodInfo {
  subentry_id: string;
  title: string;
  zones: string[];
  days: number[];
  from_time: string | null;
  to_time: string | null;
  preset: string;
}

export interface AreaInfo {
  area_id: string;
  name: string;
  floor_id: string | null;
}

export interface FloorInfo {
  floor_id: string;
  name: string;
}

export interface OverviewPayload {
  entry: {
    entry_id: string;
    title: string;
    data: Record<string, unknown>;
    options: Record<string, unknown>;
  } | null;
  presets?: Record<string, Record<string, number>>;
  season?: string;
  default_preset?: string;
  outdoor_entity_id?: string | null;
  gateway_entities?: Record<string, string>;
  areas?: AreaInfo[];
  floors?: FloorInfo[];
  master_heat?: boolean;
  master_cool?: boolean;
  temperature_unit?: string;
  zones: ZoneInfo[];
  periods: PeriodInfo[];
}
