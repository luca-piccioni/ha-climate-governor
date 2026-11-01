"""Tests for the pure schedule resolution (no HA harness needed)."""

from datetime import datetime, time
from zoneinfo import ZoneInfo

from custom_components.climate_governor.schedule import Period, resolve

ROME = ZoneInfo("Europe/Rome")

MORNING = Period(
    subentry_id="p-morning",
    zones=frozenset({"z1"}),
    days=frozenset({0, 1, 2, 3, 4}),
    from_time=time(6, 30),
    to_time=time(8, 30),
    preset="comfort",
)
NIGHT = Period(
    subentry_id="p-night",
    zones=frozenset({"z1"}),
    days=frozenset({0, 1, 2, 3, 4, 5, 6}),
    from_time=time(23, 0),
    to_time=time(6, 0),
    preset="sleep",
)
WEEKEND_EVENING = Period(
    subentry_id="p-weekend",
    zones=frozenset({"z1", "z2"}),
    days=frozenset({5, 6}),
    from_time=time(18, 0),
    to_time=time(23, 0),
    preset="boost",
)


def at(year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    return datetime(year, month, day, hour, minute, tzinfo=ROME)


def test_default_preset_when_no_period_matches() -> None:
    # Monday 2026-11-02 is a weekday; 10:00 is outside morning/night ranges.
    res = resolve(at(2026, 11, 2, 10, 0), ["z1"], [MORNING, NIGHT], "eco")
    assert res.preset == "eco"
    assert res.period_subentry_id is None


def test_weekday_morning_period_matches() -> None:
    res = resolve(at(2026, 11, 2, 7, 0), ["z1"], [MORNING, NIGHT], "eco")
    assert res.preset == "comfort"
    assert res.period_subentry_id == "p-morning"


def test_period_does_not_match_other_zone() -> None:
    res = resolve(at(2026, 11, 2, 7, 0), ["z2"], [MORNING], "eco")
    assert res.preset == "eco"


def test_midnight_crossing_evening_part() -> None:
    # Tuesday 01:00 belongs to the Monday night period.
    res = resolve(at(2026, 11, 3, 1, 0), ["z1"], [NIGHT], "eco")
    assert res.preset == "sleep"


def test_midnight_crossing_late_part() -> None:
    # Monday 23:30 belongs to the Monday night period.
    res = resolve(at(2026, 11, 2, 23, 30), ["z1"], [NIGHT], "eco")
    assert res.preset == "sleep"


def test_midnight_crossing_gap() -> None:
    # Tuesday 07:00 is between 06:00 and 23:00 -> no match.
    res = resolve(at(2026, 11, 3, 7, 0), ["z1"], [NIGHT], "eco")
    assert res.preset == "eco"


def test_first_matching_period_wins() -> None:
    overlap_a = Period(
        subentry_id="a",
        zones=frozenset({"z1"}),
        days=frozenset({0}),
        from_time=time(7, 0),
        to_time=time(9, 0),
        preset="boost",
    )
    overlap_b = Period(
        subentry_id="b",
        zones=frozenset({"z1"}),
        days=frozenset({0}),
        from_time=time(6, 0),
        to_time=time(8, 0),
        preset="eco",
    )
    res = resolve(at(2026, 11, 2, 7, 30), ["z1"], [overlap_a, overlap_b], "comfort")
    assert res.preset == "boost"
    res = resolve(at(2026, 11, 2, 7, 30), ["z1"], [overlap_b, overlap_a], "comfort")
    assert res.preset == "eco"


def test_next_change_is_period_end_when_active() -> None:
    res = resolve(at(2026, 11, 2, 7, 0), ["z1"], [MORNING], "eco")
    assert res.next_change == at(2026, 11, 2, 8, 30)


def test_next_change_is_next_start_when_inactive() -> None:
    res = resolve(at(2026, 11, 2, 10, 0), ["z1"], [MORNING], "eco")
    # Next matching start is Tuesday 06:30.
    assert res.next_change == at(2026, 11, 3, 6, 30)


def test_next_change_midnight_crossing_started_today() -> None:
    res = resolve(at(2026, 11, 2, 23, 30), ["z1"], [NIGHT], "eco")
    assert res.next_change == at(2026, 11, 3, 6, 0)


def test_next_change_midnight_crossing_early_morning() -> None:
    res = resolve(at(2026, 11, 3, 1, 0), ["z1"], [NIGHT], "eco")
    assert res.next_change == at(2026, 11, 3, 6, 0)


def test_dst_transition_keeps_wall_clock_boundary() -> None:
    # Europe/Rome DST ends 2026-10-25 03:00 -> 02:00. A period starting at
    # 02:30 on that Sunday must resolve to local 02:30 (the repeated hour is
    # resolved to the first occurrence, which is still a stable wall time).
    period = Period(
        subentry_id="dst",
        zones=frozenset({"z1"}),
        days=frozenset({6}),
        from_time=time(2, 30),
        to_time=time(3, 0),
        preset="comfort",
    )
    res = resolve(datetime(2026, 10, 25, 2, 45, tzinfo=ROME), ["z1"], [period], "eco")
    assert res.preset == "comfort"


def test_naive_datetime_treated_as_utc() -> None:
    naive = datetime(2026, 11, 2, 6, 30)  # Monday 06:30 UTC
    res = resolve(naive, ["z1"], [MORNING], "eco")
    # 06:30 UTC = 07:30 Europe/Rome (CET) -> inside the morning period.
    assert res.preset == "comfort"
