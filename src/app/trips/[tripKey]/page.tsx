"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { ApiRequestError, api } from "@/lib/api";
import { dayCount, formatDateLong, todayISO } from "@/lib/format";
import type { Trip, TripDay } from "@/lib/types";

export default function TripDetailPage() {
  const params = useParams<{ tripKey: string }>();
  const tripKey = decodeURIComponent(params.tripKey);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showEditTrip, setShowEditTrip] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tripData, daysData] = await Promise.all([
        api.getTrip(tripKey),
        api.listDays(tripKey),
      ]);
      setTrip(tripData);
      setDays(daysData.slice().sort((a, b) => a.day_date.localeCompare(b.day_date)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trip");
    }
  }, [tripKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  async function onDeleteTrip() {
    if (!confirm("Delete this trip and all its days/schedules? This cannot be undone.")) return;
    try {
      await api.deleteTrip(tripKey);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip");
    }
  }

  async function onDeleteDay(dayId: number) {
    if (!confirm("Delete this day and its schedule entries?")) return;
    try {
      await api.deleteDay(dayId);
      setDays((prev) => prev?.filter((d) => d.trip_day_id !== dayId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete day");
    }
  }

  if (error && !trip) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header title="Trip" backHref="/" />
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          <ErrorBanner message={error} />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header title="Trip" backHref="/" />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        title={trip.trip_name}
        backHref="/"
        action={
          <button
            onClick={() => setShowEditTrip(true)}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Edit trip"
          >
            ✏️
          </button>
        }
      />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">
            {formatDateLong(trip.start_date)} – {formatDateLong(trip.end_date)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {dayCount(trip.start_date, trip.end_date)} day trip · key:{" "}
            <span className="font-mono">{trip.trip_key}</span>
          </p>
          <button
            onClick={onDeleteTrip}
            className="mt-3 text-sm font-medium text-red-600 hover:underline"
          >
            Delete trip
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Itinerary days</h2>
          <Button variant="secondary" onClick={() => setShowAddDay(true)}>
            + Add day
          </Button>
        </div>

        {days === null && <Spinner />}

        {days && days.length === 0 && (
          <EmptyState
            title="No days yet"
            description="Add a day to start scheduling locations, transport, and stays."
            action={<Button onClick={() => setShowAddDay(true)}>+ Add day</Button>}
          />
        )}

        {days && days.length > 0 && (
          <ul className="flex flex-col gap-2">
            {days.map((day, idx) => (
              <li
                key={day.trip_day_id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Link
                  href={`/trips/${encodeURIComponent(tripKey)}/days/${day.trip_day_id}`}
                  className="flex-1"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-600">
                    Day {idx + 1}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatDateLong(day.day_date)}
                  </p>
                </Link>
                <button
                  onClick={() => onDeleteDay(day.trip_day_id)}
                  className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete day"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditTripModal
        open={showEditTrip}
        trip={trip}
        onClose={() => setShowEditTrip(false)}
        onSaved={(updated) => {
          setTrip(updated);
          setShowEditTrip(false);
        }}
      />

      <AddDayModal
        open={showAddDay}
        tripKey={tripKey}
        defaultDate={trip.start_date ?? todayISO()}
        onClose={() => setShowAddDay(false)}
        onAdded={(day) => {
          setDays((prev) =>
            [...(prev ?? []), day].sort((a, b) => a.day_date.localeCompare(b.day_date)),
          );
          setShowAddDay(false);
        }}
      />
    </div>
  );
}

function EditTripModal({
  open,
  trip,
  onClose,
  onSaved,
}: {
  open: boolean;
  trip: Trip;
  onClose: () => void;
  onSaved: (trip: Trip) => void;
}) {
  const [tripName, setTripName] = useState(trip.trip_name);
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form fields when modal opens
      setTripName(trip.trip_name);
      setStartDate(trip.start_date);
      setEndDate(trip.end_date);
      setError(null);
    }
  }, [open, trip]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) {
      setError("End date cannot be before the start date.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.updateTrip(trip.trip_key, {
        trip_name: tripName.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trip");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Edit trip" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Trip name</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Start date</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">End date</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
        </div>
        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={submitting} className="w-full">
          Save changes
        </Button>
      </form>
    </Modal>
  );
}

function AddDayModal({
  open,
  tripKey,
  defaultDate,
  onClose,
  onAdded,
}: {
  open: boolean;
  tripKey: string;
  defaultDate: string;
  onClose: () => void;
  onAdded: (day: TripDay) => void;
}) {
  const [date, setDate] = useState(defaultDate);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form fields when modal opens
      setDate(defaultDate);
      setError(null);
    }
  }, [open, defaultDate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const day = await api.addDay(tripKey, { day_date: date });
      onAdded(day);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError("That date is already in the itinerary.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to add day");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Add a day" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            type="date"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={submitting} className="w-full">
          Add day
        </Button>
      </form>
    </Modal>
  );
}
