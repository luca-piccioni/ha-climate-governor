# Home Assistant Climate Governor

A Home Assistant custom integration (helper) that governs the temperature of
one or more **zones** using a hybrid **deadband + duty-cycle PI** control law.
It is designed for slow thermal plants — motorized radiator valves, inverter
heat pumps, fan-coil units — where bang-bang thermostats overshoot and a
classic PID is hard to tune.

There is **no custom card and no JavaScript build**: the whole UI is built from
standard Home Assistant entities plus a shipped Lovelace dashboard.

## How it works

- **One config entry** (the "plant") with **config subentries**: one per *zone*
  and one per *schedule period*. Add zones and periods from the integration UI.
- **Control law** (`control.py`, pure Python): a PI controller whose integral is
  kept in *error-hours*, wrapped in a deadband with hysteresis, conditional
  anti-windup, and an outdoor-reset bias. For switch actuators the output is
  converted to a **duty-cycle window** (`u/100 * W`, clamped by min-on/min-off);
  for climate actuators it becomes a **setpoint offset** (cascade, no PWM).
- **Capability-probing actuators** (`actuators.py`): each actuator is probed
  from its own state attributes, so the governor tolerates climate entities that
  lack `TARGET_TEMPERATURE` (falls back to mode-only control) or expose DRY
  without `TARGET_HUMIDITY` (never calls `set_humidity`).
- **Weekly schedule + seasonal presets** (`schedule.py`, pure Python): period
  subentries map weekday ranges to a preset; the season select scales the
  controller gains.

## Configuration split

Climate Governor separates **system config** (rarely touched, lives in the
config entry `data`) from **user config** (tweaked often, lives in `options`
and in `EntityCategory.CONFIG` entities):

| System config (config flow / reconfigure) | User config (options flow + CONFIG entities) |
| --- | --- |
| Plant name, outdoor source (sensor or weather), outdoor design temp | Preset setpoints, season, default preset |
| Per zone: temperature sensors, humidity sensor, actuators, area/floor | Per zone: enable/boost, preset hold, setpoint offset |
| Per zone (advanced): tolerance, Kp, Ki, max offset, cycle window | Global: master heating / cooling switches |

The tuning numbers appear as `number.*` entities (deadband tolerance, Kp, Ki,
setpoint offset), the season and preset hold as `select.*`, and the master
switches as `switch.*`. Because they are `EntityCategory.CONFIG` they are hidden
from auto-generated dashboards — the shipped dashboard lists them explicitly.

## Dashboard (no custom card required)

A ready-made dashboard ships at [`dashboard/climate-governor.yaml`](dashboard/climate-governor.yaml):
a `sections` view with a `thermostat` card per zone, `gauge` cards for duty
cycle and control output, a `history-graph` of temperature vs output, and
`entities` cards for the tuning/diagnostic entities.

Install it either way:

1. **Storage dashboard** — create a new dashboard in the UI, *Take control*, and
   paste the `views:` block from the file.
2. **YAML dashboard** — copy the file into your Home Assistant config directory
   as `climate-governor.yaml` and add to `configuration.yaml`:

   ```yaml
   lovelace:
     dashboards:
       climate-governor:
         mode: yaml
         title: Climate Governor
         icon: mdi:thermostat
         show_in_sidebar: true
         filename: climate-governor.yaml
   ```

Entity ids are derived from the **zone name** and the **entry name** you chose
(e.g. a zone "Living" → `climate.living`, `sensor.living_duty_cycle`). Duplicate
the zone grid section for every zone subentry.

## Development container

Open this folder in VS Code with Docker available to WSL and the **Dev
Containers** extension installed, then run **Dev Containers: Reopen in
Container**. The project folder is bind-mounted at `/workspace`, so source files
and the Home Assistant configuration remain in this WSL directory.

The container installs Home Assistant and the test/lint tools into `.venv`. Use
**Tasks: Run Task** to run **Run Home Assistant** or **Run integration tests**.
Home Assistant is available at <http://localhost:8126>.

The dev container runs with `--network=host`. Under WSL2 mirrored-mode
networking, ports already held on the Windows side (for example by VS Code's
port-forward proxies) cannot be bound inside the container, so this instance
listens on **8126** rather than the usual 8123. The port is stored in
`.storage/http`, which takes precedence over the `http:` block in
`configuration.yaml`.

For WSL, keep the repository under the Linux filesystem (for example,
`/home/<user>/...`) and ensure Docker is running inside WSL or is integrated
with that distribution. Device discovery may require WSL mirrored networking;
USB and Bluetooth devices need separate passthrough setup.

## Integration layout

- `custom_components/climate_governor/` contains the integration.
- `dashboard/climate-governor.yaml` is the shipped starter dashboard.
- `configuration.yaml` is the development instance configuration (the workspace
  root is its Home Assistant config directory) and includes `input_number` /
  `template` dev fixtures so you can drive a zone from the UI without real
  hardware.
- `tests/` contains unit tests (pure `control.py`/`schedule.py`) and integration
  tests (config flow, subentries, actuators, climate entity, diagnostics,
  repairs).

Run the integration tests with `pytest -q` and lint with `ruff check .` from the
container.

## Manual smoke test

1. Run the **Run Home Assistant** task and open <http://localhost:8126>.
2. **Settings → Devices & Services → Add Integration → Climate Governor.**
   Pick `sensor.outdoor` as the outdoor source, then create a first zone using
   `sensor.living_temp` and `switch.valve`. Once configured, the entry lives on
   the **Integrations** page (it is a `hub`-type integration, not a helper);
   zones and schedule periods are **config subentries** on that entry's page.
3. Add a **period** subentry (e.g. Mon–Fri 06:30–08:30 → comfort).
4. Lower `input_number.living_temp` below the setpoint and watch
   `switch.valve` turn on for `u/100 * W` seconds and then off; `sensor.living_duty_cycle`
   tracks the scheduled fraction.
