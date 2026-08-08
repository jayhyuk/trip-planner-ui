import type {
  Accommodation,
  AccommodationInput,
  ApiError,
  Schedule,
  ScheduleInput,
  ScheduleUpdateInput,
  TravelLocation,
  TravelLocationInput,
  Transportation,
  TransportationInput,
  Trip,
  TripDay,
  TripDayInput,
  TripUpdateInput,
} from "./types";

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const body = (await res.json()) as ApiError;
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiRequestError(res.status, message);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  // Trips
  listTrips: () => request<Trip[]>("/trips"),
  createTrip: (trip: Trip) =>
    request<Trip>("/trips", { method: "POST", body: JSON.stringify(trip) }),
  getTrip: (tripKey: string) => request<Trip>(`/trips/${encodeURIComponent(tripKey)}`),
  updateTrip: (tripKey: string, trip: TripUpdateInput) =>
    request<Trip>(`/trips/${encodeURIComponent(tripKey)}`, {
      method: "PUT",
      body: JSON.stringify(trip),
    }),
  deleteTrip: (tripKey: string) =>
    request<void>(`/trips/${encodeURIComponent(tripKey)}`, { method: "DELETE" }),

  // Trip days
  listDays: (tripKey: string) =>
    request<TripDay[]>(`/trips/${encodeURIComponent(tripKey)}/days`),
  addDay: (tripKey: string, input: TripDayInput) =>
    request<TripDay>(`/trips/${encodeURIComponent(tripKey)}/days`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateDay: (tripDayId: number, input: TripDayInput) =>
    request<TripDay>(`/days/${tripDayId}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteDay: (tripDayId: number) =>
    request<void>(`/days/${tripDayId}`, { method: "DELETE" }),

  // Schedules
  listSchedules: (tripDayId: number) =>
    request<Schedule[]>(`/days/${tripDayId}/schedules`),
  createSchedule: (tripDayId: number, input: ScheduleInput) =>
    request<Schedule>(`/days/${tripDayId}/schedules`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getSchedule: (scheduleId: number) => request<Schedule>(`/schedules/${scheduleId}`),
  updateSchedule: (scheduleId: number, input: ScheduleUpdateInput) =>
    request<Schedule>(`/schedules/${scheduleId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteSchedule: (scheduleId: number) =>
    request<void>(`/schedules/${scheduleId}`, { method: "DELETE" }),
};

export type {
  Accommodation,
  AccommodationInput,
  Schedule,
  ScheduleInput,
  ScheduleUpdateInput,
  TravelLocation,
  TravelLocationInput,
  Transportation,
  TransportationInput,
  Trip,
  TripDay,
  TripDayInput,
  TripUpdateInput,
};
