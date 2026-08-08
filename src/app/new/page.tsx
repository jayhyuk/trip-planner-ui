"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/Button";
import ErrorBanner from "@/components/ErrorBanner";
import Header from "@/components/Header";
import { ApiRequestError, api } from "@/lib/api";
import { slugify, todayISO } from "@/lib/format";

export default function NewTripPage() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [tripKey, setTripKey] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onTripNameChange(value: string) {
    setTripName(value);
    if (!keyEdited) setTripKey(slugify(value));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tripName.trim() || !tripKey.trim()) {
      setError("Trip name and trip key are required.");
      return;
    }
    if (endDate < startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    setSubmitting(true);
    try {
      const trip = await api.createTrip({
        trip_key: tripKey.trim(),
        trip_name: tripName.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      router.push(`/trips/${encodeURIComponent(trip.trip_key)}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError("That trip key is already taken. Try a different one.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create trip");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header title="New trip" backHref="/" />
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Trip name</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Japan 2026"
              value={tripName}
              onChange={(e) => onTripNameChange(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Trip key <span className="font-normal text-slate-400">(shareable, unique)</span>
            </span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base font-mono focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="japan-2026"
              value={tripKey}
              onChange={(e) => {
                setKeyEdited(true);
                setTripKey(slugify(e.target.value));
              }}
              required
            />
            <span className="text-xs text-slate-400">
              Friends can view/edit this trip by visiting its link — no login needed.
            </span>
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

          <Button type="submit" loading={submitting} className="mt-2 w-full">
            Create trip
          </Button>
        </div>
      </form>
    </div>
  );
}
