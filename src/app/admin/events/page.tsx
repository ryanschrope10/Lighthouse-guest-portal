import Link from "next/link";
import { format, isAfter } from "date-fns";
import { CalendarDays, Plus, MapPin, ExternalLink } from "lucide-react";
import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { EventContent } from "@/types/events";

export const dynamic = "force-dynamic";

function formatRange(starts: string | null, ends: string | null): string {
  if (!starts && !ends) return "No date set";
  if (starts && ends) {
    const s = new Date(starts);
    const e = new Date(ends);
    const sameDay =
      s.toDateString() === e.toDateString();
    if (sameDay) {
      return `${format(s, "MMM d, yyyy h:mm a")} – ${format(e, "h:mm a")}`;
    }
    return `${format(s, "MMM d, yyyy h:mm a")} → ${format(e, "MMM d, yyyy h:mm a")}`;
  }
  const d = new Date((starts ?? ends)!);
  return format(d, "MMM d, yyyy h:mm a");
}

function isPast(item: EventContent): boolean {
  const ref = item.ends_at ?? item.starts_at;
  if (!ref) return false;
  return !isAfter(new Date(ref), new Date());
}

export default async function AdminEventsPage() {
  let items: EventContent[] = [];
  let errorMessage: string | null = null;
  try {
    items = (await sql`
      select id, property_id, type, title, body, media_url, external_url, location,
             starts_at, ends_at, schedule, sort_order, active, created_at
      from property_content
      where type in ('event','schedule')
      order by starts_at asc nulls last
    `) as EventContent[];
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load events";
  }

  const upcoming = items.filter((i) => !isPast(i));
  const past = items.filter(isPast);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events & Schedules</h1>
          <p className="mt-1 text-sm text-sand-500">
            Publish onsite events and recurring series (e.g. food truck weeks).
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load: {errorMessage}
        </div>
      )}

      <Section title="Upcoming" items={upcoming} empty="No upcoming items." />
      <Section title="Past" items={past} empty="Nothing in the past." muted />
    </div>
  );
}

function Section({
  title,
  items,
  empty,
  muted,
}: {
  title: string;
  items: EventContent[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sand-500">
        {title}
      </h2>
      <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={empty}
            description={
              muted
                ? undefined
                : "Create an event or schedule to start publishing to guests."
            }
          />
        ) : (
          <ul className="divide-y divide-sand-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/events/${item.id}/edit`}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-sand-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <Badge status={item.type === "event" ? "info" : "warning"}>
                        {item.type === "event" ? "Event" : "Schedule"}
                      </Badge>
                      <Badge status={item.active ? "success" : "neutral"}>
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sand-600">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatRange(item.starts_at, item.ends_at)}
                      </span>
                      {item.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.location}
                        </span>
                      )}
                      {item.external_url && (
                        <span className="inline-flex items-center gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          link
                        </span>
                      )}
                      {item.type === "schedule" && item.schedule?.entries && (
                        <span>{item.schedule.entries.length} entries</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
