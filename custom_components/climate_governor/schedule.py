"""Pure weekly schedule resolution for Climate Governor.

No Home Assistant imports: periods are plain data, and resolution is a pure
function of ``now`` plus the configured periods, so it can be unit tested
deterministically (including DST and midnight-crossing ranges).
"""

from dataclasses import dataclass
from datetime import UTC, datetime, time, timedelta

MONDAY = 0
LAST_DAY_INDEX = 6
DAYS_IN_WEEK = 7


@dataclass(frozen=True, slots=True)
class Period:
    """One weekly time range applying a preset to a set of zones."""

    subentry_id: str
    zones: frozenset[str]
    days: frozenset[int]  # 0 = Monday .. 6 = Sunday
    from_time: time
    to_time: time
    preset: str

    @property
    def crosses_midnight(self) -> bool:
        return self.to_time <= self.from_time

    def applies_on_day(self, day: int) -> bool:
        return day in self.days

    def contains_wall_time(self, day: int, wall: time) -> bool:
        """Whether *wall* falls inside this period for a period starting on *day*."""
        if not self.applies_on_day(day):
            return False
        if self.crosses_midnight:
            return wall >= self.from_time or wall < self.to_time
        return self.from_time <= wall < self.to_time


@dataclass(frozen=True, slots=True)
class ScheduleResolution:
    """The effective preset for a zone at an instant."""

    preset: str
    period_subentry_id: str | None
    next_change: datetime | None


def _as_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def resolve(
    now: datetime,
    zones: list[str],
    periods: list[Period],
    default_preset: str,
) -> ScheduleResolution:
    """Return the preset effective for *zone* at *now*.

    The first matching period in list order wins, so users can order periods
    by priority in the UI. *next_change* is the next instant at which the
    effective preset could change (a period start or end).
    """
    now = _as_aware(now)
    local = now.astimezone(now.tzinfo)
    wall = local.time()
    day = local.weekday()

    active: Period | None = None
    for period in periods:
        if period.zones.isdisjoint(zones):
            continue
        # A midnight-crossing period listed for yesterday also covers this
        # day's early hours.
        if period.contains_wall_time(day, wall) or (
            period.crosses_midnight
            and period.applies_on_day((day - 1) % DAYS_IN_WEEK)
            and wall < period.to_time
        ):
            active = period
            break

    next_change = _next_change(local, day, active, periods)
    return ScheduleResolution(
        preset=active.preset if active else default_preset,
        period_subentry_id=active.subentry_id if active else None,
        next_change=next_change,
    )


def _wall_to_aware(base: datetime, day_offset: int, wall: time) -> datetime:
    """Build an aware datetime at *wall* on ``base.date() + day_offset``.

    Attaching the tzinfo of *base* reinterprets the wall-clock time in that
    zone, which keeps schedule boundaries stable across DST transitions.
    """
    tz = base.tzinfo
    naive = datetime.combine(base.date() + timedelta(days=day_offset), wall)
    if tz is None:
        return naive.replace(tzinfo=UTC)
    return naive.replace(tzinfo=tz)


def _next_change(
    local: datetime,
    day: int,
    active: Period | None,
    periods: list[Period],
) -> datetime | None:
    """Earliest period boundary strictly after *local* within the next week."""
    candidates: list[datetime] = []

    if active is not None:
        # End of the active period: today if it does not cross midnight and
        # the end is still ahead, otherwise tomorrow (or the day after for a
        # crossing range that started yesterday).
        if active.crosses_midnight:
            if local.time() >= active.from_time:
                candidates.append(_wall_to_aware(local, 1, active.to_time))
            else:
                candidates.append(_wall_to_aware(local, 0, active.to_time))
        elif _wall_to_aware(local, 0, active.to_time) > local:
            candidates.append(_wall_to_aware(local, 0, active.to_time))
        else:
            candidates.append(_wall_to_aware(local, 1, active.to_time))

    # Next start of any period within the next week.
    for offset in range(0, DAYS_IN_WEEK + 1):
        candidate_day = (day + offset) % DAYS_IN_WEEK
        for period in periods:
            if not period.applies_on_day(candidate_day):
                continue
            start = _wall_to_aware(local, offset, period.from_time)
            if start > local:
                candidates.append(start)

    if not candidates:
        return None
    return min(candidates)


def next_change_after(now: datetime, periods: list[Period]) -> datetime | None:
    """Public helper: earliest boundary strictly after *now* (any zone)."""
    now = _as_aware(now)
    local = now.astimezone(now.tzinfo)
    return _next_change(local, local.weekday(), None, periods)
