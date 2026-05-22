import { format, startOfWeek, isAfter } from "date-fns";
import { CalendarDays, MapPin, ExternalLink, Clock } from "lucide-react";
import { sql } from "@/lib/db";
import { getCurrentProperty } from "@/lib/session";
import { getProperty } from "@/lib/newbook/data";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { EventContent, ScheduleEntry } from "@/types/events";

export const dynamic = "force-dynamic";

function weekKey(d: Date): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

function weekLabel(key: string): string {
  return `Week of ${format(new Date(key), "MMM d, yyyy")}`;
}

interface NormalizedItem {
  id: string;
  parentId: string;
  type: "event" | "schedule";
  title: string;
  body: string | null;
  location: string | null;
  external_url: string | null;
  starts_at: Date | null;
  ends_at: Date | null;
  label: string | null;
}

function normalize(items: EventContent[]): NormalizedItem[] {
  const now = new Date();
  const out: NormalizedItem[] = [];

  for (const item of items) {
    if (item.type === "event") {
      const start = item.starts_at ? new Date(item.starts_at) : null;
      const end = item.ends_at ? new Date(item.ends_at) : null;
      const cutoff = end ?? start;
      if (cutoff && !isAfter(cutoff, now)) continue;
      out.push({
        id: item.id,
        parentId: item.id,
        type: "event",
        title: item.title,
        body: item.body,
        location: item.location,
        external_url: item.external_url,
        starts_at: start,
        ends_at: end,
        label: null,
      });
      continue;
    }

    // schedule: expand entries
    const entries: ScheduleEntry[] = item.schedule?.entries ?? [];
    if (entries.length === 0) {
      const start = item.starts_at ? new Date(item.starts_at) : null;
      out.push({
        id: item.id,
        parentId: item.id,
        type: "schedule",
        title: item.title,
        body: item.body,
        location: item.location,
        external_url: item.external_url,
        starts_at: start,
        ends_at: item.ends_at ? new Date(item.ends_at) : null,
        label: null,
      });
      continue;
    }
    for (const entry of entries) {
      if (!entry.date) continue;
      const d = new Date(entry.date);
      if (!isAfter(d, new Date(now.toDateString())) && d.toDateString() !== now.toDateString()) {
        continue;
      }
      out.push({
        id: `${item.id}:${entry.date}`,
        parentId: item.id,
        type: "schedule",
        title: item.title,
        body: item.body,
        location: item.location,
        external_url: item.external_url,
        starts_at: d,
        ends_at: null,
        label: entry.label,
      });
    }
  }

  return out.sort((a, b) => {
    const ax = a.starts_at?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bx = b.starts_at?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return ax - bx;
  });
}

export default async function EventsPage() {
  const property = await getCurrentProperty();
  const displayProperty = getProperty();

  let items: EventContent[] = [];
  let errorMessage: string | null = null;
  try {
    items = (await sql`
      select id, property_id, type, title, body, media_url, external_url, location,
             starts_at, ends_at, schedule, sort_order, active, created_at
      from property_content
      where property_id = ${property.id}
        and active = true
        and type in ('event','schedule')
      order by starts_at asc nulls last
    `) as EventContent[];
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load events";
  }

  const normalized = normalize(items);

  // Group by week
  const groups = new Map<string, NormalizedItem[]>();
  const noDate: NormalizedItem[] = [];
  for (const n of normalized) {
    if (!n.starts_at) {
      noDate.push(n);
      continue;
    }
    const key = weekKey(n.starts_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }
  const sortedKeys = [...groups.keys()].sort();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Events & Schedules</h1>
        <p className="mt-1 text-sm text-sand-600">
          Things happening at {displayProperty.name}.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&apos;t load events: {errorMessage}
        </div>
      )}

      {normalized.length === 0 && noDate.length === 0 && (
        <Card>
          <CardBody>
            <EmptyState
              icon={CalendarDays}
              title="Nothing on the calendar yet"
              description="Check back soon — events and weekly drops will show up here."
            />
          </CardBody>
        </Card>
      )}

      {sortedKeys.map((key) => (
        <section key={key} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
            {weekLabel(key)}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.get(key)!.map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      {noDate.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
            More
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {noDate.map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EventCard({ item }: { item: NormalizedItem }) {
  return (
    <Card className="border-gold-100">
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
          <Badge status={item.type === "event" ? "info" : "warning"}>
            {item.type === "event" ? "Event" : "Schedule"}
          </Badge>
        </div>

        {item.label && (
          <p className="text-sm font-medium text-gold-700">{item.label}</p>
        )}

        {item.starts_at && (
          <div className="flex items-center gap-1.5 text-sm text-sand-700">
            <CalendarDays className="h-4 w-4 text-sand-500" />
            <span>
              {format(item.starts_at, "EEE, MMM d")}
              {item.starts_at.getHours() + item.starts_at.getMinutes() > 0 && (
                <>
                  {" "}• {format(item.starts_at, "h:mm a")}
                  {item.ends_at && (
                    <> – {format(item.ends_at, "h:mm a")}</>
                  )}
                </>
              )}
            </span>
          </div>
        )}

        {item.location && (
          <div className="flex items-center gap-1.5 text-sm text-sand-600">
            <MapPin className="h-4 w-4 text-sand-500" />
            {item.location}
          </div>
        )}

        {item.body && (
          <p className="whitespace-pre-line text-sm text-sand-700">{item.body}</p>
        )}

        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:text-gold-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            More info
          </a>
        )}

        {!item.starts_at && (
          <div className="flex items-center gap-1.5 text-xs text-sand-500">
            <Clock className="h-3.5 w-3.5" />
            Date TBA
          </div>
        )}
      </CardBody>
    </Card>
  );
}
