import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { sql } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import type { EventContent } from "@/types/events";

interface UpcomingEventsCardProps {
  propertyId: string;
  limit?: number;
}

export default async function UpcomingEventsCard({
  propertyId,
  limit = 3,
}: UpcomingEventsCardProps) {
  const nowIso = new Date().toISOString();

  const items = (await sql`
    select id, type, title, location, starts_at, ends_at, schedule
    from property_content
    where property_id = ${propertyId}
      and active = true
      and type in ('event', 'schedule')
      and (ends_at >= ${nowIso} or starts_at >= ${nowIso})
    order by starts_at asc nulls last
    limit ${limit}
  `) as Pick<
    EventContent,
    "id" | "type" | "title" | "location" | "starts_at" | "ends_at" | "schedule"
  >[];

  if (items.length === 0) return null;

  return (
    <Card>
      <CardBody className="!py-0">
        <div className="flex items-center justify-between pb-2 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
            Upcoming Events
          </p>
          <Link
            href="/events"
            className="text-xs font-medium text-gold-700 hover:text-gold-800"
          >
            See all
          </Link>
        </div>
        <ul className="divide-y divide-sand-100">
          {items.map((item) => {
            const dateLabel = formatItemDate(item);
            return (
              <li key={item.id}>
                <Link
                  href="/events"
                  className="flex items-start gap-3 py-3 transition-colors hover:bg-sand-50/40"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-50">
                    <CalendarDays className="h-4 w-4 text-gold-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-sand-600">
                      {dateLabel && <span>{dateLabel}</span>}
                      {item.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-sand-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}

function formatItemDate(
  item: Pick<EventContent, "type" | "starts_at" | "schedule">
): string {
  if (item.starts_at) {
    return format(new Date(item.starts_at), "EEE, MMM d • h:mm a");
  }
  if (item.type === "schedule" && item.schedule?.entries?.length) {
    const next = item.schedule.entries.find(
      (e) => new Date(e.date) >= new Date(new Date().toDateString())
    );
    if (next) return format(new Date(next.date), "EEE, MMM d");
  }
  return "";
}
