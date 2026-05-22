export type EventContentType = "event" | "schedule";

export interface ScheduleEntry {
  date: string;
  label: string;
}

export interface ScheduleData {
  entries: ScheduleEntry[];
}

export interface EventContent {
  id: string;
  property_id: string;
  type: EventContentType;
  title: string;
  body: string | null;
  media_url: string | null;
  external_url: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  schedule: ScheduleData | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface EventInput {
  type: EventContentType;
  title: string;
  body?: string | null;
  media_url?: string | null;
  external_url?: string | null;
  location?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  schedule?: ScheduleData | null;
  sort_order?: number;
  active?: boolean;
  property_id?: string;
}
