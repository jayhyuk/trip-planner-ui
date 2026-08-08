"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import Spinner from "@/components/Spinner";
import { api } from "@/lib/api";
import { dayCount, formatDateShort } from "@/lib/format";
import type { Trip } from "@/lib/types";

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listTrips()
      .then((data) => active && setTrips(data))
      .catch((err) => active && setError(err.message ?? "Failed to load trips"));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your trips ✈️</h1>
          <p className="text-sm text-slate-500">Plan itineraries together with friends</p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {trips === null && !error && <Spinner />}

      {trips && trips.length === 0 && (
        <EmptyState
          title="No trips yet"
          description="Create your first trip to start building a day-by-day itinerary with your friends."
          action={
            <Link href="/new">
              <Button>+ New trip</Button>
            </Link>
          }
        />
      )}

      {trips && trips.length > 0 && (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.trip_key}>
              <Link
                href={`/trips/${encodeURIComponent(trip.trip_key)}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {trip.trip_name}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {formatDateShort(trip.start_date)} – {formatDateShort(trip.end_date)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                    {dayCount(trip.start_date, trip.end_date)}d
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/new"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl text-white shadow-lg transition hover:bg-teal-700 active:scale-95"
        aria-label="New trip"
      >
        +
      </Link>
    </div>
  );
}
