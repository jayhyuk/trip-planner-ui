export interface Trip {
  trip_key: string;
  trip_name: string;
  start_date: string;
  end_date: string;
}

export interface TripUpdateInput {
  trip_name: string;
  start_date: string;
  end_date: string;
}

export interface TripDay {
  trip_day_id: number;
  trip_key: string;
  day_date: string;
}

export interface TripDayInput {
  day_date: string;
}

export type ScheduleType = "travel_location" | "transportation" | "accommodation";

interface ScheduleBase {
  schedule_id: number;
  trip_day_id: number;
  scheduled_time: string;
  schedule_type: ScheduleType;
}

export interface TravelLocation extends ScheduleBase {
  schedule_type: "travel_location";
  travel_location_name?: string;
  is_free?: boolean;
  ticket_purchased?: boolean;
  detail_link?: string;
  description?: string;
}

export interface Transportation extends ScheduleBase {
  schedule_type: "transportation";
  transportation_name?: string;
  is_booked?: boolean;
}

export interface Accommodation extends ScheduleBase {
  schedule_type: "accommodation";
  accommodation_name?: string;
  detail_link?: string;
  is_booked?: boolean;
}

export type Schedule = TravelLocation | Transportation | Accommodation;

export interface TravelLocationInput {
  scheduled_time: string;
  schedule_type: "travel_location";
  travel_location_name: string;
  is_free: boolean;
  ticket_purchased?: boolean;
  detail_link?: string;
  description?: string;
}

export interface TransportationInput {
  scheduled_time: string;
  schedule_type: "transportation";
  transportation_name: string;
  is_booked?: boolean;
}

export interface AccommodationInput {
  scheduled_time: string;
  schedule_type: "accommodation";
  accommodation_name: string;
  detail_link?: string;
  is_booked?: boolean;
}

export type ScheduleInput = TravelLocationInput | TransportationInput | AccommodationInput;

export interface ScheduleUpdateInput {
  scheduled_time?: string;
  travel_location_name?: string;
  transportation_name?: string;
  accommodation_name?: string;
  is_free?: boolean;
  ticket_purchased?: boolean;
  is_booked?: boolean;
  detail_link?: string;
  description?: string;
}

export interface ApiError {
  error: string;
}
