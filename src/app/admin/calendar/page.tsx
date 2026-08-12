/**
 * /admin/calendar — confirmed bookings, laid out by the customer's trip date.
 *
 * The board answers "where is this deal"; the calendar answers "what is booked
 * that week", which is the question that decides whether a van is free. Only
 * won deals appear — an open lead's trip date is a request, not a commitment,
 * and mixing the two would make a busy-looking week mean nothing. Every card
 * links to the lead screen, so the calendar stays a way in rather than a second
 * place to edit bookings.
 *
 * There is no time-of-day axis on purpose: `preferred_date` is a DATE, so an
 * hourly grid would have to invent times the customer never gave. Days are
 * therefore lists, and the week view earns its keep by showing the whole card
 * — reference, phone, value, owner — instead of squeezing more hours in.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { LeadReference } from '@/components/admin/LeadReference';
import {
  addDays,
  addMonths,
  buildMonthGrid,
  buildWeekGrid,
  formatMonthLabel,
  formatWeekLabel,
  isToday,
  startOfDay,
  toDateKey,
  WEEKDAY_LABELS,
} from '@/lib/calendar';
import { serviceLabel, vehicleLabel } from '@/lib/crm/normalize';
import { formatPeso } from '@/lib/format';
import * as inquiryService from '@/services/inquiry.service';
import type { CalendarBooking, CalendarResponse } from '@/models/crm.types';

type CalendarView = 'month' | 'week';

/** Beyond this a month cell stops being readable and grows a "+N more". */
const MONTH_CELL_LIMIT = 3;

export default function AdminCalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));

  const [data, setData] = useState<CalendarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Day keys the agent has clicked "+N more" on. */
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const days = useMemo(
    () => (view === 'month' ? buildMonthGrid(anchor) : buildWeekGrid(anchor)),
    [view, anchor]
  );

  // The fetch range is exactly the grid, so the days a month view borrows from
  // its neighbours are populated too.
  const rangeFrom = toDateKey(days[0]);
  const rangeTo = toDateKey(days[days.length - 1]);

  /**
   * Holding the arrow down fires several overlapping requests, and without a
   * sequence number the slowest one wins and paints the wrong month.
   */
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setIsLoading(true);

    try {
      const response = await inquiryService.listCalendarBookings({
        from: rangeFrom,
        to: rangeTo,
      });
      if (requestId !== requestRef.current) return;
      setData(response);
      setError(null);
    } catch {
      if (requestId !== requestRef.current) return;
      setError('Could not load the calendar.');
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const item of data?.items ?? []) {
      const bucket = map.get(item.preferredDate) ?? [];
      bucket.push(item);
      map.set(item.preferredDate, bucket);
    }
    return map;
  }, [data?.items]);

  const totalValue = useMemo(
    () =>
      (data?.items ?? []).reduce(
        (sum, item) => sum + (Number.parseFloat(item.monetaryValue) || 0),
        0
      ),
    [data?.items]
  );

  const goPrevious = () =>
    setAnchor((current) => (view === 'month' ? addMonths(current, -1) : addDays(current, -7)));

  const goNext = () =>
    setAnchor((current) => (view === 'month' ? addMonths(current, 1) : addDays(current, 7)));

  const goToday = () => setAnchor(startOfDay(new Date()));

  /**
   * Switching month → week from the 1st would otherwise strand the agent in the
   * first week of the month, so today wins whenever it is already on screen.
   */
  const changeView = (next: CalendarView) => {
    if (next === view) return;
    const today = startOfDay(new Date());
    const todayVisible = days.some((day) => toDateKey(day) === toDateKey(today));
    setView(next);
    setExpandedDays(new Set());
    if (todayVisible) setAnchor(today);
  };

  const toggleDay = (key: string) =>
    setExpandedDays((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const periodLabel =
    view === 'month' ? formatMonthLabel(anchor) : formatWeekLabel(days[0], days[days.length - 1]);

  const bookingCount = data?.items.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-600">
            Booked trips by date. Click one to open the lead.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <i className="pi pi-refresh mr-1.5 text-xs" /> Refresh
        </button>
      </header>

      {/* Period navigation + view switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevious}
            aria-label={view === 'month' ? 'Previous month' : 'Previous week'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <i className="pi pi-chevron-left text-xs" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={view === 'month' ? 'Next month' : 'Next week'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <i className="pi pi-chevron-right text-xs" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Today
          </button>

          <div className="ml-1 min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{periodLabel}</h2>
            <p className="text-xs text-slate-600">
              {isLoading
                ? 'Loading…'
                : `${bookingCount} booking${bookingCount === 1 ? '' : 's'}${
                    totalValue > 0 ? ` · ${formatPeso(totalValue)}` : ''
                  }`}
            </p>
          </div>
        </div>

        <div className="flex rounded-lg border border-slate-200 p-0.5">
          {(['month', 'week'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeView(option)}
              aria-pressed={view === option}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === option ? 'bg-coral text-white' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {data?.truncated && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
        >
          This range has more bookings than the calendar shows at once. Switch to the week view to
          see them all.
        </div>
      )}

      <div className={isLoading && data ? 'opacity-60 transition-opacity' : undefined}>
        {view === 'month' ? (
          <MonthGrid
            days={days}
            month={anchor.getMonth()}
            byDay={byDay}
            expandedDays={expandedDays}
            onToggleDay={toggleDay}
          />
        ) : (
          <WeekGrid days={days} byDay={byDay} />
        )}
      </div>

      {isLoading && !data && (
        <div className="flex min-h-[20vh] items-center justify-center text-slate-600">
          <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading calendar…
        </div>
      )}
    </div>
  );
}

// --- Month view -------------------------------------------------------------

function MonthGrid({
  days,
  month,
  byDay,
  expandedDays,
  onToggleDay,
}: {
  days: Date[];
  /** The month actually being viewed — the rest of the grid is padding. */
  month: number;
  byDay: Map<string, CalendarBooking[]>;
  expandedDays: Set<string>;
  onToggleDay: (key: string) => void;
}) {
  return (
    // Seven readable columns need more width than a phone has, so the grid
    // scrolls sideways rather than crushing every cell to an unreadable strip.
    <div className="overflow-x-auto">
      <div className="min-w-[52rem]">
        <div className="grid grid-cols-7 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-b-xl border-b border-r border-slate-200 bg-white">
          {days.map((day) => {
            const key = toDateKey(day);
            const items = byDay.get(key) ?? [];
            const isExpanded = expandedDays.has(key);
            const visible = isExpanded ? items : items.slice(0, MONTH_CELL_LIMIT);
            const hidden = items.length - visible.length;
            const inMonth = day.getMonth() === month;
            const today = isToday(day);

            return (
              <div
                key={key}
                className={`min-h-[7.5rem] border-l border-t border-slate-200 ${
                  inMonth ? 'bg-white' : 'bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between px-2 pt-1.5">
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                      today
                        ? 'bg-coral text-white'
                        : inMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[11px] tabular-nums text-slate-500">{items.length}</span>
                  )}
                </div>

                <div className="space-y-1 p-1.5 pt-1">
                  {visible.map((item) => (
                    <BookingChip key={item.opportunityId} booking={item} />
                  ))}

                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={() => onToggleDay(key)}
                      className="w-full rounded px-1.5 py-1 text-left text-[11px] font-medium text-coral hover:bg-coral/5"
                    >
                      +{hidden} more
                    </button>
                  )}

                  {isExpanded && items.length > MONTH_CELL_LIMIT && (
                    <button
                      type="button"
                      onClick={() => onToggleDay(key)}
                      className="w-full rounded px-1.5 py-1 text-left text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * A single booking in a month cell — one line. Every chip is the same emerald
 * as the Booked stage badge, because every chip *is* a booked deal; varying the
 * colour would imply a distinction the grid no longer makes.
 */
function BookingChip({ booking }: { booking: CalendarBooking }) {
  const detail = booking.tourTitle ?? vehicleLabel(booking.vehicleType);

  return (
    <Link
      href={`/admin/inquiries/${booking.opportunityId}`}
      title={`${booking.reference} · ${booking.contactName ?? 'Unnamed lead'}${
        detail ? ` · ${detail}` : ''
      }`}
      className="block truncate rounded border border-emerald-200 bg-emerald-100 px-1.5 py-1 text-[11px] font-medium text-emerald-800 transition-opacity hover:opacity-80"
    >
      {booking.contactName ?? 'Unnamed lead'}
      <span className="font-normal opacity-75"> · {serviceLabel(booking.serviceType)}</span>
    </Link>
  );
}

// --- Week view --------------------------------------------------------------

function WeekGrid({ days, byDay }: { days: Date[]; byDay: Map<string, CalendarBooking[]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((day) => {
        const key = toDateKey(day);
        const items = byDay.get(key) ?? [];
        const today = isToday(day);

        return (
          <div
            key={key}
            className={`rounded-xl border p-2 ${
              today ? 'border-coral bg-coral/5' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="mb-2 flex items-baseline justify-between px-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {WEEKDAY_LABELS[day.getDay()]}
                </p>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    today ? 'text-coral' : 'text-slate-900'
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>
              {items.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-800">
                  {items.length}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-slate-400">No bookings</p>
              ) : (
                items.map((item) => <BookingCard key={item.opportunityId} booking={item} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The fuller card the week view has room for. The phone number is on it because
 * the week view is what you open the morning of a trip.
 */
function BookingCard({ booking }: { booking: CalendarBooking }) {
  const detail = booking.tourTitle ?? vehicleLabel(booking.vehicleType);
  const amount = Number.parseFloat(booking.monetaryValue) || 0;

  return (
    <Link
      href={`/admin/inquiries/${booking.opportunityId}`}
      className="block rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="truncate text-sm font-semibold text-slate-900">
        {booking.contactName ?? 'Unnamed lead'}
      </p>
      <div className="mt-1">
        <LeadReference reference={booking.reference} />
      </div>
      <p className="mt-1.5 truncate text-xs text-slate-600">
        {serviceLabel(booking.serviceType)}
        {detail ? ` · ${detail}` : ''}
      </p>
      {booking.phone && (
        <p className="mt-1 truncate text-xs tabular-nums text-slate-600">
          <i className="pi pi-phone mr-1 text-[9px]" />
          {booking.phone}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
        {booking.ownerName ? (
          <span className="truncate text-[11px] text-slate-500">
            <i className="pi pi-user mr-1 text-[9px]" />
            {booking.ownerName}
          </span>
        ) : (
          <span />
        )}
        {amount > 0 && (
          <span className="text-xs font-semibold tabular-nums text-slate-800">
            {formatPeso(amount)}
          </span>
        )}
      </div>
    </Link>
  );
}
