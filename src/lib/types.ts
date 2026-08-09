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

export type TodoStatus = "open" | "close";

export interface TripTodo {
  todo_id: number;
  trip_key: string;
  todo_name: string;
  status: TodoStatus;
}

export interface TripTodoInput {
  todo_name: string;
  status?: TodoStatus;
}

export interface TripTodoUpdateInput {
  todo_name?: string;
  status?: TodoStatus;
}

export interface TodoOption {
  option_id: number;
  todo_id: number;
  option_name: string;
  description?: string | null;
  price?: number | null;
  detail_link?: string | null;
  option_date?: string | null;
  image_urls: string[];
}

export interface TripTodoWithOptions extends TripTodo {
  options: TodoOption[];
}

export interface TodoOptionInput {
  option_name: string;
  description?: string;
  price?: number;
  detail_link?: string;
  option_date?: string;
  image_urls?: string[];
}

export interface TodoOptionUpdateInput {
  option_name?: string;
  description?: string | null;
  price?: number | null;
  detail_link?: string | null;
  option_date?: string | null;
  image_urls?: string[];
}

export interface TodoComparison {
  todo: TripTodo;
  columns: string[];
  options: TodoOption[];
}

export interface ApiError {
  error: string;
}
