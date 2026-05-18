"use client";

import { useState } from "react";
import {
  Mountain,
  Utensils,
  Sparkles,
  Compass,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import clsx from "clsx";
import type {
  LocalGuide as LocalGuideData,
  LocalCategoryId,
  LocalPlace,
} from "@/lib/local-guide";

interface CategoryTheme {
  icon: React.ComponentType<{ className?: string }>;
  /** Gradient for the card art band. */
  art: string;
  /** Active chip background. */
  chip: string;
  /** Icon tint on the art band. */
  glyph: string;
}

const THEME: Record<LocalCategoryId, CategoryTheme> = {
  outdoors: {
    icon: Mountain,
    art: "bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600",
    chip: "bg-emerald-600 text-white border-emerald-600",
    glyph: "text-white/85",
  },
  food: {
    icon: Utensils,
    art: "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500",
    chip: "bg-orange-600 text-white border-orange-600",
    glyph: "text-white/85",
  },
  local: {
    icon: Sparkles,
    art: "bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600",
    chip: "bg-violet-600 text-white border-violet-600",
    glyph: "text-white/85",
  },
  daytrip: {
    icon: Compass,
    art: "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
    chip: "bg-blue-600 text-white border-blue-600",
    glyph: "text-white/85",
  },
};

function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query,
  )}`;
}

function PlaceCard({ place }: { place: LocalPlace }) {
  const theme = THEME[place.category];
  const Icon = theme.icon;

  return (
    <a
      href={mapsUrl(place.mapsQuery)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-sand-300 hover:shadow-md"
    >
      {/* Art band */}
      <div
        className={clsx(
          "relative flex h-20 items-center justify-center",
          theme.art,
        )}
      >
        {place.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.image}
            alt={place.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Icon className={clsx("h-9 w-9", theme.glyph)} />
        )}
        <span className="absolute right-2 top-2 rounded-full bg-white/90 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5 text-gray-700" />
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="text-sm font-semibold text-gray-900">{place.name}</p>
        <p className="flex items-center gap-1 text-xs text-sand-500">
          <MapPin className="h-3 w-3 shrink-0" />
          {place.area}
        </p>
        <p className="line-clamp-3 text-xs leading-relaxed text-sand-600">
          {place.blurb}
        </p>
      </div>
    </a>
  );
}

export function LocalGuide({ guide }: { guide: LocalGuideData }) {
  const [active, setActive] = useState<LocalCategoryId | "all">("all");

  const places =
    active === "all"
      ? guide.places
      : guide.places.filter((p) => p.category === active);

  return (
    <section className="rounded-xl border border-sand-200 bg-white p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          Explore {guide.area}
        </h2>
        <span className="text-xs text-sand-500">{places.length} spots</span>
      </div>
      <p className="mt-0.5 text-sm text-sand-600">
        Hand-picked things to do near the park — tap any spot for directions.
      </p>

      {/* Category filter chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            active === "all"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-sand-300 bg-white text-sand-700 hover:bg-sand-50",
          )}
        >
          All
        </button>
        {guide.categories.map((cat) => {
          const theme = THEME[cat.id];
          const CatIcon = theme.icon;
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? theme.chip
                  : "border-sand-300 bg-white text-sand-700 hover:bg-sand-50",
              )}
            >
              <CatIcon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </section>
  );
}
