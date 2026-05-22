import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sql } from "@/lib/db";
import { EventForm } from "@/components/events/event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const properties = (await sql`
    select id, name from properties order by name
  `) as Array<{ id: string; name: string }>;

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
        <h1 className="text-2xl font-bold text-gray-900">New event or schedule</h1>
        <p className="mt-1 text-sm text-sand-500">
          Single dated event or a recurring series with custom drops.
        </p>
      </div>

      <EventForm properties={properties} />
    </div>
  );
}
