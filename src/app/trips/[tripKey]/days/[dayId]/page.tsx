"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { api } from "@/lib/api";
import { formatDateLong } from "@/lib/format";
import type {
  Schedule,
  ScheduleInput,
  ScheduleType,
  ScheduleUpdateInput,
  TripDay,
} from "@/lib/types";

const TYPE_META: Record<ScheduleType, { label: string; icon: string }> = {
  travel_location: { label: "Place to visit", icon: "📍" },
  transportation: { label: "Transportation", icon: "🚗" },
  accommodation: { label: "Accommodation", icon: "🏨" },
};

export default function DayDetailPage() {
  const params = useParams<{ tripKey: string; dayId: string }>();
  const tripKey = decodeURIComponent(params.tripKey);
  const dayId = Number(params.dayId);

  const [day, setDay] = useState<TripDay | null>(null);
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [days, scheduleList] = await Promise.all([
        api.listDays(tripKey),
        api.listSchedules(dayId),
      ]);
      const current = days.find((d) => d.trip_day_id === dayId) ?? null;
      setDay(current);
      setSchedules(
        scheduleList.slice().sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load day");
    }
  }, [tripKey, dayId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  async function onDeleteSchedule(scheduleId: number) {
    if (!confirm("Delete this schedule entry?")) return;
    try {
      await api.deleteSchedule(scheduleId);
      setSchedules((prev) => prev?.filter((s) => s.schedule_id !== scheduleId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        title={day ? formatDateLong(day.day_date) : "Day"}
        backHref={`/trips/${encodeURIComponent(tripKey)}`}
      />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Schedule</h2>
          <Button variant="secondary" onClick={() => setShowAdd(true)}>
            + Add entry
          </Button>
        </div>

        {schedules === null && <Spinner />}

        {schedules && schedules.length === 0 && (
          <EmptyState
            title="Nothing scheduled"
            description="Add places to visit, transportation, or accommodation for this day."
            action={<Button onClick={() => setShowAdd(true)}>+ Add entry</Button>}
          />
        )}

        {schedules && schedules.length > 0 && (
          <ul className="flex flex-col gap-2">
            {schedules.map((s) => (
              <ScheduleCard
                key={s.schedule_id}
                schedule={s}
                onEdit={() => setEditing(s)}
                onDelete={() => onDeleteSchedule(s.schedule_id)}
              />
            ))}
          </ul>
        )}
      </div>

      <AddScheduleModal
        open={showAdd}
        dayId={dayId}
        onClose={() => setShowAdd(false)}
        onAdded={(s) => {
          setSchedules((prev) =>
            [...(prev ?? []), s].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
          );
          setShowAdd(false);
        }}
      />

      <EditScheduleModal
        schedule={editing}
        onClose={() => setEditing(null)}
        onSaved={(s) => {
          setSchedules(
            (prev) =>
              prev
                ?.map((item) => (item.schedule_id === s.schedule_id ? s : item))
                .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)) ?? null,
          );
          setEditing(null);
        }}
      />
    </div>
  );
}

function scheduleTitle(s: Schedule): string {
  if (s.schedule_type === "travel_location") return s.travel_location_name || "Place to visit";
  if (s.schedule_type === "transportation") return s.transportation_name || "Transportation";
  return s.accommodation_name || "Accommodation";
}

function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: Schedule;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[schedule.schedule_type];
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-600">
            {meta.icon} {schedule.scheduled_time} · {meta.label}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-slate-900">
            {scheduleTitle(schedule)}
          </p>
          {schedule.schedule_type === "travel_location" && schedule.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{schedule.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {schedule.schedule_type === "travel_location" && (
              <>
                <Badge label={schedule.is_free ? "Free" : "Paid"} tone={schedule.is_free ? "green" : "amber"} />
                {!schedule.is_free && (
                  <Badge
                    label={schedule.ticket_purchased ? "Ticket bought" : "Ticket not bought"}
                    tone={schedule.ticket_purchased ? "green" : "red"}
                  />
                )}
              </>
            )}
            {schedule.schedule_type === "transportation" && (
              <Badge label={schedule.is_booked ? "Booked" : "Not booked"} tone={schedule.is_booked ? "green" : "red"} />
            )}
            {schedule.schedule_type === "accommodation" && (
              <Badge label={schedule.is_booked ? "Booked" : "Not booked"} tone={schedule.is_booked ? "green" : "red"} />
            )}
          </div>
        </button>
        <button
          onClick={onDelete}
          className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete entry"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "amber" | "red" }) {
  const toneClasses = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses}`}>{label}</span>;
}

function AddScheduleModal({
  open,
  dayId,
  onClose,
  onAdded,
}: {
  open: boolean;
  dayId: number;
  onClose: () => void;
  onAdded: (s: Schedule) => void;
}) {
  const [type, setType] = useState<ScheduleType>("travel_location");
  const [time, setTime] = useState("09:00");
  const [name, setName] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [ticketPurchased, setTicketPurchased] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [detailLink, setDetailLink] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form fields when modal opens
      setType("travel_location");
      setTime("09:00");
      setName("");
      setIsFree(false);
      setTicketPurchased(false);
      setIsBooked(false);
      setDetailLink("");
      setDescription("");
      setError(null);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let input: ScheduleInput;
      if (type === "travel_location") {
        input = {
          scheduled_time: time,
          schedule_type: "travel_location",
          travel_location_name: name.trim(),
          is_free: isFree,
          ticket_purchased: ticketPurchased,
          detail_link: detailLink.trim() || undefined,
          description: description.trim() || undefined,
        };
      } else if (type === "transportation") {
        input = {
          scheduled_time: time,
          schedule_type: "transportation",
          transportation_name: name.trim(),
          is_booked: isBooked,
        };
      } else {
        input = {
          scheduled_time: time,
          schedule_type: "accommodation",
          accommodation_name: name.trim(),
          detail_link: detailLink.trim() || undefined,
          is_booked: isBooked,
        };
      }
      const created = await api.createSchedule(dayId, input);
      onAdded(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Add schedule entry" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          {(Object.keys(TYPE_META) as ScheduleType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium ${
                type === t
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {TYPE_META[t].icon} {TYPE_META[t].label}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Time</span>
          <input
            type="time"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder={
              type === "travel_location"
                ? "Senso-ji"
                : type === "transportation"
                  ? "Airport Express"
                  : "Hotel Sakura"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        {type === "travel_location" && (
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
              <span className="text-sm text-slate-700">Free entry</span>
            </label>
            {!isFree && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ticketPurchased}
                  onChange={(e) => setTicketPurchased(e.target.checked)}
                />
                <span className="text-sm text-slate-700">Ticket already purchased</span>
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Link</span>
              <input
                type="url"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="https://..."
                value={detailLink}
                onChange={(e) => setDetailLink(e.target.value)}
              />
            </label>
          </>
        )}

        {type === "transportation" && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isBooked} onChange={(e) => setIsBooked(e.target.checked)} />
            <span className="text-sm text-slate-700">Booked</span>
          </label>
        )}

        {type === "accommodation" && (
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isBooked} onChange={(e) => setIsBooked(e.target.checked)} />
              <span className="text-sm text-slate-700">Booked</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Link</span>
              <input
                type="url"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="https://..."
                value={detailLink}
                onChange={(e) => setDetailLink(e.target.value)}
              />
            </label>
          </>
        )}

        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={submitting} className="w-full">
          Add entry
        </Button>
      </form>
    </Modal>
  );
}

function EditScheduleModal({
  schedule,
  onClose,
  onSaved,
}: {
  schedule: Schedule | null;
  onClose: () => void;
  onSaved: (s: Schedule) => void;
}) {
  const [time, setTime] = useState("09:00");
  const [name, setName] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [ticketPurchased, setTicketPurchased] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [detailLink, setDetailLink] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!schedule) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form fields when schedule to edit changes
    setTime(schedule.scheduled_time);
    setError(null);
    if (schedule.schedule_type === "travel_location") {
      setName(schedule.travel_location_name ?? "");
      setIsFree(!!schedule.is_free);
      setTicketPurchased(!!schedule.ticket_purchased);
      setDetailLink(schedule.detail_link ?? "");
      setDescription(schedule.description ?? "");
    } else if (schedule.schedule_type === "transportation") {
      setName(schedule.transportation_name ?? "");
      setIsBooked(!!schedule.is_booked);
    } else {
      setName(schedule.accommodation_name ?? "");
      setIsBooked(!!schedule.is_booked);
      setDetailLink(schedule.detail_link ?? "");
    }
  }, [schedule]);

  if (!schedule) return null;
  const meta = TYPE_META[schedule.schedule_type];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schedule) return;
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input: ScheduleUpdateInput = { scheduled_time: time };
      if (schedule.schedule_type === "travel_location") {
        input.travel_location_name = name.trim();
        input.is_free = isFree;
        input.ticket_purchased = ticketPurchased;
        input.detail_link = detailLink.trim() || undefined;
        input.description = description.trim() || undefined;
      } else if (schedule.schedule_type === "transportation") {
        input.transportation_name = name.trim();
        input.is_booked = isBooked;
      } else {
        input.accommodation_name = name.trim();
        input.is_booked = isBooked;
        input.detail_link = detailLink.trim() || undefined;
      }
      const updated = await api.updateSchedule(schedule.schedule_id, input);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!schedule} title={`Edit ${meta.label.toLowerCase()}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Time</span>
          <input
            type="time"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        {schedule.schedule_type === "travel_location" && (
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
              <span className="text-sm text-slate-700">Free entry</span>
            </label>
            {!isFree && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ticketPurchased}
                  onChange={(e) => setTicketPurchased(e.target.checked)}
                />
                <span className="text-sm text-slate-700">Ticket already purchased</span>
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Link</span>
              <input
                type="url"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                value={detailLink}
                onChange={(e) => setDetailLink(e.target.value)}
              />
            </label>
          </>
        )}

        {schedule.schedule_type === "transportation" && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isBooked} onChange={(e) => setIsBooked(e.target.checked)} />
            <span className="text-sm text-slate-700">Booked</span>
          </label>
        )}

        {schedule.schedule_type === "accommodation" && (
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isBooked} onChange={(e) => setIsBooked(e.target.checked)} />
              <span className="text-sm text-slate-700">Booked</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Link</span>
              <input
                type="url"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                value={detailLink}
                onChange={(e) => setDetailLink(e.target.value)}
              />
            </label>
          </>
        )}

        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={submitting} className="w-full">
          Save changes
        </Button>
      </form>
    </Modal>
  );
}
