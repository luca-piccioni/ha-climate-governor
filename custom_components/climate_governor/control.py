"""Pure control law for Climate Governor.

This module must not import from Home Assistant so it can be unit tested
deterministically without a HA harness.
"""

from dataclasses import dataclass, replace
from math import exp

MIN_OUTPUT = 0.0
MAX_OUTPUT = 100.0
SECONDS_PER_HOUR = 3600.0


def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp *value* into the inclusive range [lo, hi]."""
    return max(lo, min(hi, value))


@dataclass(frozen=True, slots=True)
class ControlParams:
    """Tuned parameters for one control step (already season-scaled)."""

    kp: float = 40.0
    ki: float = 8.0
    tolerance: float = 0.3
    cycle_window: float = 900.0
    tau_i: float = 3600.0
    max_offset: float = 1.5
    outdoor_reset_gain: float = 0.6
    outdoor_reset_max: float = 3.0
    outdoor_design_temp: float = -7.0
    min_on: float = 60.0
    min_off: float = 120.0
    cycle_cooldown: float = 60.0


@dataclass(frozen=True, slots=True)
class ControlState:
    """Mutable-by-copy integrator state for one zone."""

    integral: float = 0.0
    in_deadband: bool = False
    output: float = 0.0
    bias_reset: float = 0.0


@dataclass(frozen=True, slots=True)
class StepResult:
    """Result of one control step."""

    state: ControlState
    output: float
    error: float
    duty_on_seconds: float


def apply_deadband(
    error: float, tolerance: float, in_deadband: bool
) -> tuple[float, bool]:
    """Return the effective error and deadband membership with hysteresis.

    While inside the band the error reads as zero; the zone only leaves the
    band when |error| exceeds the tolerance (entering the band happens at
    |error| <= tolerance).
    """
    if in_deadband:
        if abs(error) <= tolerance:
            return 0.0, True
        return error, False
    if abs(error) <= tolerance:
        return 0.0, True
    return error, False


def outdoor_reset_bias(
    outdoor_temp: float | None,
    mode_is_cooling: bool,
    params: ControlParams,
) -> float:
    """Return the outdoor-reset bias in percent of output.

    Heating: colder outdoors -> more bias. Cooling: warmer outdoors -> more
    bias. Returns 0 when no outdoor temperature is available.
    """
    if outdoor_temp is None:
        return 0.0
    if mode_is_cooling:
        delta = outdoor_temp - (-params.outdoor_design_temp)
    else:
        delta = params.outdoor_design_temp - outdoor_temp
    gain = params.outdoor_reset_gain * delta
    return clamp(gain, MIN_OUTPUT, params.outdoor_reset_max)


def step(
    error: float,
    dt: float,
    params: ControlParams,
    state: ControlState,
    *,
    outdoor_temp: float | None = None,
    mode_is_cooling: bool = False,
    actuator_blocked: bool = False,
    bias_pv: float = 0.0,
) -> StepResult:
    """Advance the PI controller by *dt* seconds for the given *error*.

    *error* is signed so that positive means "more heating (or cooling)
    needed": heating ``T_set - T_meas``, cooling ``T_meas - T_set``.
    """
    effective, in_deadband = apply_deadband(error, params.tolerance, state.in_deadband)
    bias_reset = outdoor_reset_bias(outdoor_temp, mode_is_cooling, params)

    integral = state.integral
    if dt > 0:
        # Decay the integral while inside the deadband or when blocked.
        if effective == 0.0 or actuator_blocked:
            integral *= exp(-dt / params.tau_i) if params.tau_i > 0 else 0.0
        else:
            integral += effective * dt / SECONDS_PER_HOUR

    unsaturated = params.kp * effective + params.ki * integral + bias_reset + bias_pv
    output = clamp(unsaturated, MIN_OUTPUT, MAX_OUTPUT)

    # Conditional anti-windup: only keep the integral when the controller is
    # not saturated, or when the correction would reduce saturation.
    if dt > 0 and not actuator_blocked and effective != 0.0:
        if unsaturated > MAX_OUTPUT and effective > 0:
            integral = state.integral
        elif unsaturated < MIN_OUTPUT and effective < 0:
            integral = state.integral

    new_state = replace(
        state,
        integral=integral,
        in_deadband=in_deadband,
        output=output,
        bias_reset=bias_reset,
    )
    duty_on = duty_window_seconds(output, params)
    return StepResult(
        state=new_state,
        output=output,
        error=effective,
        duty_on_seconds=duty_on,
    )


def duty_window_seconds(output: float, params: ControlParams) -> float:
    """Map a 0..100 output to an ON-time in seconds inside the cycle window.

    Clamped so that a valve is never pulsed shorter than ``min_on`` nor
    shorter than ``window - min_off`` off-time, unless the output is zero.
    """
    window = params.cycle_window
    if output <= MIN_OUTPUT:
        return 0.0
    t_on = output / MAX_OUTPUT * window
    if window <= params.min_on + params.min_off:
        # Degenerate window: run the whole window when output > 0.
        return window
    return clamp(t_on, params.min_on, window - params.min_off)


def setpoint_offset(output: float, params: ControlParams) -> float:
    """Cascade setpoint shift for climate actuators (no PWM)."""
    return clamp(output / MAX_OUTPUT * params.max_offset, 0.0, params.max_offset)


def reset_integral(state: ControlState) -> ControlState:
    """Return *state* with the integral term cleared."""
    return replace(state, integral=0.0)
