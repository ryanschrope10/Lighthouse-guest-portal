import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { sql } from "@/lib/db";
import { EventForm } from "@/components/events/event-form";
import type { EventContent } from "@/types/events";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [itemsRaw, propertiesRaw] = await Promise.all([
    sql`
      select id, property_id, type, title, body, media_url, external_url, location,
             starts_at, ends_at, schedule, sort_order, active, created_at
      from property_content
      where id = ${id}
      limit 1
    `,
    sql`select id, name from properties order by name`,
  ]);
  const items = itemsRaw as EventContent[];
  const properties = propertiesRaw as Array<{ id: string; name: string }>;

  if (items.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1 text-sm text-sand-600 hover:text-gold-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit</h1>
        <p className="mt-1 text-sm text-sand-500">
          Changes go live immediately for any active item.
        </p>
      </div>

      <EventForm properties={properties} initial={items[0]} />
    </div>
  );
}
