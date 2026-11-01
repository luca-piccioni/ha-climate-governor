"""Tests for the pure control law (no HA harness needed)."""

from custom_components.climate_governor.control import (
    ControlParams,
    ControlState,
    apply_deadband,
    duty_window_seconds,
    outdoor_reset_bias,
    reset_integral,
    setpoint_offset,
    step,
)

PARAMS = ControlParams(
    kp=40.0,
    ki=8.0,
    tolerance=0.3,
    cycle_window=900.0,
    tau_i=3600.0,
    max_offset=1.5,
    outdoor_reset_gain=0.6,
    outdoor_reset_max=3.0,
    outdoor_design_temp=-7.0,
    min_on=60.0,
    min_off=120.0,
    cycle_cooldown=60.0,
)


def test_deadband_zeroes_error_inside_band() -> None:
    effective, in_band = apply_deadband(0.2, 0.3, in_deadband=False)
    assert effective == 0.0
    assert in_band


def test_deadband_hysteresis_exits_only_beyond_tolerance() -> None:
    # Inside the band, a small error reads as zero.
    effective, in_band = apply_deadband(0.25, 0.3, in_deadband=True)
    assert effective == 0.0
    assert in_band
    # Beyond the tolerance the band is exited and the raw error is used.
    effective, in_band = apply_deadband(0.35, 0.3, in_deadband=True)
    assert effective == 0.35
    assert not in_band


def test_step_proportional_response() -> None:
    result = step(1.0, 60.0, PARAMS, ControlState())
    # Integral is kept in error-hours: 1.0 * 60/3600 = 1/60.
    assert result.state.integral == 1.0 / 60.0
    # P = 40 * 1.0, I = 8 * 1/60 -> 40.133...
    assert result.output == 40.0 + 8.0 / 60.0


def test_step_output_clamped_to_100() -> None:
    result = step(10.0, 600.0, PARAMS, ControlState())
    assert result.output == 100.0


def test_anti_windup_does_not_grow_integral_when_saturated_same_direction() -> None:
    state = ControlState(integral=500.0)
    result = step(5.0, 60.0, PARAMS, state)
    # Unsaturated would be way above 100 with a positive error -> integral frozen.
    assert result.state.integral == 500.0
    assert result.output == 100.0


def test_anti_windup_allows_integral_to_shrink_when_unwinding() -> None:
    state = ControlState(integral=500.0)
    result = step(-1.0, 60.0, PARAMS, state)
    assert result.state.integral < 500.0


def test_integral_decays_in_deadband() -> None:
    state = ControlState(integral=1000.0, in_deadband=True)
    result = step(0.0, 3600.0, PARAMS, state)
    assert result.state.integral < 1000.0 * 0.4  # one tau -> ~37%


def test_integral_decays_when_blocked() -> None:
    state = ControlState(integral=1000.0)
    result = step(1.0, 60.0, PARAMS, state, actuator_blocked=True)
    assert result.state.integral < 1000.0


def test_outdoor_reset_bias_heating() -> None:
    bias = outdoor_reset_bias(-12.0, mode_is_cooling=False, params=PARAMS)
    # gain 0.6 * (design -7 - (-12)) = 0.6 * 5 = 3.0, clamped at max 3.0
    assert bias == 3.0


def test_outdoor_reset_bias_cooling() -> None:
    bias = outdoor_reset_bias(32.0, mode_is_cooling=True, params=PARAMS)
    # gain 0.6 * (32 - 7) = 15 -> clamped to 3.0
    assert bias == 3.0


def test_outdoor_reset_bias_none_returns_zero() -> None:
    assert outdoor_reset_bias(None, mode_is_cooling=False, params=PARAMS) == 0.0


def test_duty_window_zero_output() -> None:
    assert duty_window_seconds(0.0, PARAMS) == 0.0


def test_duty_window_proportional() -> None:
    assert duty_window_seconds(50.0, PARAMS) == 450.0


def test_duty_window_clamped_to_min_on() -> None:
    assert duty_window_seconds(1.0, PARAMS) == 60.0


def test_duty_window_clamped_to_window_minus_min_off() -> None:
    assert duty_window_seconds(100.0, PARAMS) == 780.0


def test_duty_window_degenerate() -> None:
    tiny = ControlParams(cycle_window=100.0, min_on=60.0, min_off=120.0)
    assert duty_window_seconds(10.0, tiny) == 100.0


def test_setpoint_offset_scales_with_output() -> None:
    assert setpoint_offset(50.0, PARAMS) == 0.75
    assert setpoint_offset(100.0, PARAMS) == 1.5
    assert setpoint_offset(0.0, PARAMS) == 0.0


def test_reset_integral() -> None:
    state = ControlState(integral=123.0, output=50.0)
    assert reset_integral(state).integral == 0.0
    assert reset_integral(state).output == 50.0
