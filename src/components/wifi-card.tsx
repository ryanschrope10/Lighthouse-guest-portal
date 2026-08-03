"use client";

import { useEffect, useState } from "react";
import { Wifi, Copy, Check } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { ApiResponse } from "@/types/index";
import type { ParkInfo } from "@/app/api/park-info/route";

// Guest Wi-Fi, controlled from the admin Wi-Fi settings. Renders nothing
// until it knows there's a network to show, so it never leaves an empty card
// on the dashboard.
export function WifiCard() {
  const [info, setInfo] = useState<ParkInfo | null>(null);
  const [copied, setCopied] = useState<"network" | "password" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/park-info", { cache: "no-store" });
        const json: ApiResponse<ParkInfo> = await res.json();
        if (!cancelled && json.data) setInfo(json.data);
      } catch {
        /* dashboard degrades gracefully without Wi-Fi */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info?.wifi_network) return null;

  const copy = async (value: string, which: "network" | "password") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* user can still read it */
    }
  };

  const Row = ({
    label,
    value,
    which,
  }: {
    label: string;
    value: string;
    which: "network" | "password";
  }) => (
    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-sand-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium uppercase tracking-wide text-sand-600">
          {label}
        </p>
        <p className="mt-0.5 break-all font-mono text-[19px] font-bold text-gray-900">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => copy(value, which)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-700"
        aria-label={`Copy ${label}`}
      >
        {copied === which ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <Copy className="h-5 w-5" />
        )}
      </button>
    </div>
  );

  return (
    <Card className="rounded-[14px]">
      <CardBody className="!p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-50">
            <Wifi className="h-5 w-5 text-gold-700" />
          </span>
          <p className="text-[15px] font-bold uppercase tracking-wide text-sand-700">
            Park Wi-Fi
          </p>
        </div>
        <div className="mt-3.5 space-y-2.5">
          <Row label="Network" value={info.wifi_network} which="network" />
          {info.wifi_password && (
            <Row label="Password" value={info.wifi_password} which="password" />
          )}
        </div>
        {info.wifi_note && (
          <p className="mt-3 text-[15px] text-sand-800">{info.wifi_note}</p>
        )}
      </CardBody>
    </Card>
  );
}
