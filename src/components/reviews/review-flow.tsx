"use client";

import { useEffect, useState } from "react";
import { Star, Check, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import type { ApiResponse } from "@/types/index";
import type { Review } from "@/types/reviews";

interface ReviewFlowProps {
  bookingId?: string;
  title?: string;
}

type Phase = "rate" | "public" | "private" | "done";

export function ReviewFlow({ bookingId, title }: ReviewFlowProps) {
  const [phase, setPhase] = useState<Phase>("rate");
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews");
        const json: ApiResponse<Review[]> = await res.json();
        if (cancelled) return;
        if (json.data) {
          const match = json.data.find((r) => r.booking_id === bookingId);
          if (match) setExistingReview(match);
        }
      } catch {
        // non-blocking; let user submit a new review if check fails
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!checked) return null;
  if (existingReview) return null;

  async function submitReview(input: {
    rating: number;
    is_public_intent: boolean;
    feedback?: string;
  }): Promise<Review | null> {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          rating: input.rating,
          feedback: input.feedback,
          is_public_intent: input.is_public_intent,
        }),
      });
      const json: ApiResponse<Review> = await res.json();
      if (!res.ok || !json.data) {
        setError(json.error ?? "Failed to save your review");
        return null;
      }
      setReview(json.data);
      return json.data;
    } catch {
      setError("Could not reach the review service");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStarConfirm() {
    if (rating < 1) return;
    if (rating >= 4) {
      const saved = await submitReview({
        rating,
        is_public_intent: true,
      });
      if (saved) setPhase("public");
    } else {
      setPhase("private");
    }
  }

  async function handlePrivateSubmit() {
    const saved = await submitReview({
      rating,
      is_public_intent: false,
      feedback,
    });
    if (saved) setPhase("done");
  }

  async function handlePublicClick() {
    if (!review?.public_cta_url) return;
    try {
      await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_cta_clicked: true }),
      });
    } catch {
      // best-effort; still send guest to review URL
    }
    window.open(review.public_cta_url, "_blank", "noopener,noreferrer");
    setPhase("done");
  }

  function handlePublicSkip() {
    setPhase("done");
  }

  return (
    <Card>
      <CardBody>
        {title && (
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        )}

        {phase === "rate" && (
          <div className="space-y-4">
            <p className="text-sm text-sand-600">How was your stay?</p>
            <StarPicker
              value={rating}
              hover={hover}
              onHover={setHover}
              onSelect={setRating}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Button
                onClick={handleStarConfirm}
                disabled={rating < 1 || submitting}
                loading={submitting}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {phase === "public" && (
          <div className="space-y-4">
            <StarPicker value={rating} hover={0} onHover={() => {}} readOnly />
            <p className="text-base font-medium text-gray-900">
              Glad you enjoyed it! Mind sharing publicly?
            </p>
            <p className="text-sm text-sand-600">
              A quick public review helps other guests find us.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={handlePublicSkip}>
                Skip
              </Button>
              <Button
                onClick={handlePublicClick}
                disabled={!review?.public_cta_url}
              >
                <ExternalLink className="h-4 w-4" />
                Leave a public review
              </Button>
            </div>
            {!review?.public_cta_url && (
              <p className="text-xs text-sand-500">
                {/* TODO: property hasn't configured branding.public_review_url */}
                Public review link not configured yet — thanks for the rating!
              </p>
            )}
          </div>
        )}

        {phase === "private" && (
          <div className="space-y-4">
            <StarPicker value={rating} hover={0} onHover={() => {}} readOnly />
            <p className="text-base font-medium text-gray-900">
              We&apos;re sorry to hear that.
            </p>
            <p className="text-sm text-sand-600">
              Tell us what went wrong so we can make it right.
            </p>
            <Textarea
              label="Your feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What could we have done better?"
              rows={4}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Button
                onClick={handlePrivateSubmit}
                disabled={submitting || feedback.trim().length === 0}
                loading={submitting}
              >
                Send feedback
              </Button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              Thanks for sharing
            </p>
            <p className="mt-1 text-sm text-sand-500">
              {rating >= 4
                ? "We appreciate you taking the time."
                : "A team member will follow up shortly."}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

interface StarPickerProps {
  value: number;
  hover: number;
  onHover: (n: number) => void;
  onSelect?: (n: number) => void;
  readOnly?: boolean;
}

function StarPicker({
  value,
  hover,
  onHover,
  onSelect,
  readOnly,
}: StarPickerProps) {
  const display = hover || value;
  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => onHover(0)}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`${value || 0} of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && onHover(n)}
            onClick={() => !readOnly && onSelect?.(n)}
            className={clsx(
              "rounded p-1 transition-colors",
              !readOnly && "hover:bg-gold-50",
              readOnly && "cursor-default",
            )}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              className={clsx(
                "h-8 w-8",
                filled
                  ? "fill-gold-500 text-gold-500"
                  : "fill-transparent text-sand-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
