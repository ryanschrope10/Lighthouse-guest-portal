"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Star, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import type { ApiResponse } from "@/types/index";
import type { Review } from "@/types/reviews";

export default function GuestReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews");
        const json: ApiResponse<Review[]> = await res.json();
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

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!reviews) {
    return (
      <div className="mx-auto flex w-full max-w-3xl justify-center pt-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
        Your Reviews
      </h1>
      <p className="mt-1 text-sm text-sand-500">
        Past ratings and feedback you have shared.
      </p>

      {reviews.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description="After your next stay, you'll be invited to share feedback here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Stars rating={review.rating} />
          <span className="text-xs text-sand-500">
            {format(parseISO(review.created_at), "MMM d, yyyy")}
          </span>
          {review.is_public_intent ? (
            <Badge status="success">Public review</Badge>
          ) : (
            <Badge status="neutral">Private feedback</Badge>
          )}
        </div>

        {review.feedback && (
          <p className="text-sm text-sand-700 whitespace-pre-wrap">
            {review.feedback}
          </p>
        )}

        {review.staff_response && (
          <div className="rounded-lg bg-sand-50 border border-sand-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sand-500">
              Response from the property
            </p>
            <p className="mt-1 text-sm text-sand-800 whitespace-pre-wrap">
              {review.staff_response}
            </p>
            {review.staff_responded_at && (
              <p className="mt-2 text-xs text-sand-500">
                {format(parseISO(review.staff_responded_at), "MMM d, yyyy")}
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
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
