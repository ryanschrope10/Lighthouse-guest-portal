"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Star, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import type { ApiResponse } from "@/types/index";
import type { ReviewWithGuestBooking } from "@/types/reviews";

type FilterKey = "all" | "public" | "private" | "awaiting";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "public", label: "Public-intent (4+)" },
  { key: "private", label: "Private feedback (<4)" },
  { key: "awaiting", label: "Awaiting response" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithGuestBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews");
        const json: ApiResponse<ReviewWithGuestBooking[]> = await res.json();
        if (cancelled) return;
        if (json.error || !json.data) {
          setError(json.error ?? "Failed to load reviews");
          return;
        }
        setReviews(json.data);
      } catch {
        if (!cancelled) setError("Could not reach the review service");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!reviews) return [];
    switch (filter) {
      case "public":
        return reviews.filter((r) => r.rating >= 4);
      case "private":
        return reviews.filter((r) => r.rating < 4);
      case "awaiting":
        return reviews.filter((r) => !r.staff_response);
      default:
        return reviews;
    }
  }, [reviews, filter]);

  function handleResponded(updated: ReviewWithGuestBooking) {
    setReviews((prev) =>
      prev ? prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)) : prev,
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!reviews) {
    return (
      <div className="flex justify-center pt-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm text-sand-500">
          Guest ratings and feedback for your property.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-gold-600 text-white"
                : "bg-white text-sand-700 border border-sand-200 hover:bg-sand-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews match this filter"
          description="Try a different filter to see more reviews."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <AdminReviewRow key={r.id} review={r} onResponded={handleResponded} />
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminReviewRowProps {
  review: ReviewWithGuestBooking;
  onResponded: (updated: ReviewWithGuestBooking) => void;
}

function AdminReviewRow({ review, onResponded }: AdminReviewRowProps) {
  const [draft, setDraft] = useState(review.staff_response ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const guestName = formatGuestName(review.guest);

  async function handleSubmit() {
    if (draft.trim().length === 0) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_response: draft.trim() }),
      });
      const json: ApiResponse<ReviewWithGuestBooking> = await res.json();
      if (!res.ok || !json.data) {
        setErr(json.error ?? "Failed to save response");
        return;
      }
      onResponded(json.data);
    } catch {
      setErr("Could not reach the review service");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Stars rating={review.rating} />
            <span className="text-sm font-medium text-gray-900">
              {guestName}
            </span>
            {review.is_public_intent ? (
              <Badge status="success">Public-intent</Badge>
            ) : (
              <Badge status="warning">Private</Badge>
            )}
            {review.public_cta_clicked && (
              <Badge status="info">Clicked review link</Badge>
            )}
          </div>
          <span className="text-xs text-sand-500">
            {format(parseISO(review.created_at), "MMM d, yyyy")}
          </span>
        </div>

        {review.booking && (
          <p className="text-xs text-sand-500">
            Stay: {format(parseISO(review.booking.check_in), "MMM d")} –{" "}
            {format(parseISO(review.booking.check_out), "MMM d, yyyy")}
            {review.booking.site_or_room
              ? ` · ${review.booking.site_or_room}`
              : ""}
          </p>
        )}

        {review.feedback && (
          <p className="text-sm text-sand-700 whitespace-pre-wrap">
            {review.feedback}
          </p>
        )}

        {review.staff_response ? (
          <div className="rounded-lg bg-sand-50 border border-sand-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sand-500">
              Your response
            </p>
            <p className="mt-1 text-sm text-sand-800 whitespace-pre-wrap">
              {review.staff_response}
            </p>
            {review.staff_responded_at && (
              <p className="mt-2 text-xs text-sand-500">
                Sent {format(parseISO(review.staff_responded_at), "MMM d, yyyy")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              label="Respond to guest"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Acknowledge their feedback and explain next steps..."
              rows={3}
            />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={saving || draft.trim().length === 0}
                loading={saving}
                size="sm"
              >
                Respond
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function formatGuestName(
  guest: ReviewWithGuestBooking["guest"],
): string {
  if (!guest) return "Guest";
  const parts = [guest.first_name, guest.last_name].filter(Boolean).join(" ");
  return parts.length > 0 ? parts : guest.email;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={clsx(
            "h-4 w-4",
            n <= rating
              ? "fill-gold-500 text-gold-500"
              : "fill-transparent text-sand-300",
          )}
        />
      ))}
    </div>
  );
}
