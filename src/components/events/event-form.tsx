"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  EventContent,
  EventContentType,
  EventInput,
  ScheduleEntry,
} from "@/types/events";

interface Property {
  id: string;
  name: string;
}

interface EventFormProps {
  properties: Property[];
  initial?: EventContent | null;
  defaultPropertyId?: string;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function EventForm({ properties, initial, defaultPropertyId }: EventFormProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [propertyId, setPropertyId] = useState(
    initial?.property_id ?? defaultPropertyId ?? properties[0]?.id ?? ""
  );
  const [type, setType] = useState<EventContentType>(initial?.type ?? "event");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? "");
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.ends_at ?? null));
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [entries, setEntries] = useState<ScheduleEntry[]>(
    initial?.schedule?.entries ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addEntry() {
    setEntries((prev) => [...prev, { date: "", label: "" }]);
  }
  function updateEntry(idx: number, patch: Partial<ScheduleEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }
  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!propertyId) {
      setError("Select a property");
      return;
    }

    setError(null);
    setSaving(true);

    const payload: EventInput = {
      property_id: propertyId,
      type,
      title: title.trim(),
      body: body.trim() || null,
      media_url: mediaUrl.trim() || null,
      external_url: externalUrl.trim() || null,
      location: location.trim() || null,
      starts_at: fromLocalInput(startsAt),
      ends_at: fromLocalInput(endsAt),
      schedule:
        type === "schedule" && entries.length
          ? { entries: entries.filter((e) => e.date && e.label) }
          : null,
      sort_order: Number(sortOrder) || 0,
      active,
    };

    try {
      const url = isEdit
        ? `/api/admin/events/${initial!.id}`
        : "/api/admin/events";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Save failed");
      }
      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${initial!.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Delete failed");
      }
      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Property"
          name="property_id"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          options={properties.map((p) => ({ value: p.id, label: p.name }))}
        />
        <Select
          label="Type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as EventContentType)}
          options={[
            { value: "event", label: "Event (single dated)" },
            { value: "schedule", label: "Schedule (recurring series)" },
          ]}
        />
      </div>

      <Input
        label="Title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Spring BBQ Bash"
        required
      />

      <Textarea
        label="Body"
        name="body"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Description, details, what to bring..."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Starts at"
          type="datetime-local"
          name="starts_at"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <Input
          label="Ends at"
          type="datetime-local"
          name="ends_at"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Location"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Pavilion A"
        />
        <Input
          label="External URL"
          type="url"
          name="external_url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <Input
        label="Media URL"
        type="url"
        name="media_url"
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        placeholder="https://images.example.com/..."
      />

      {type === "schedule" && (
        <div className="rounded-xl border border-gold-200 bg-gold-50/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gold-800">
              Schedule entries
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addEntry}
            >
              <Plus className="h-4 w-4" />
              Add entry
            </Button>
          </div>

          {entries.length === 0 ? (
            <p className="text-xs text-sand-500">
              No entries yet. Use this for recurring drops like a food truck
              schedule.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-lg border border-sand-200 bg-white p-3 sm:flex-row sm:items-end"
                >
                  <div className="sm:w-44">
                    <Input
                      label="Date"
                      type="date"
                      value={entry.date}
                      onChange={(e) =>
                        updateEntry(idx, { date: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Label"
                      value={entry.label}
                      onChange={(e) =>
                        updateEntry(idx, { label: e.target.value })
                      }
                      placeholder="Korean BBQ — Seoul Mama 5–8pm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sand-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label="Remove entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Sort order"
          type="number"
          name="sort_order"
          value={String(sortOrder)}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
        <div className="flex items-end gap-3 pb-1">
          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              active ? "bg-gold-500" : "bg-sand-300"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                active ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-sand-200 pt-4">
        <div>
          {isEdit && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/admin/events")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );
}
