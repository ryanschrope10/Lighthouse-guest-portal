"use client";

import { useCallback, useEffect, useState } from "react";
import { Wifi } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse } from "@/types/index";
import type { ParkSettings } from "@/app/api/admin/park-settings/route";

export default function AdminWifiPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [network, setNetwork] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/park-settings", {
          cache: "no-store",
        });
        const json: ApiResponse<ParkSettings> = await res.json();
        if (cancelled) return;
        if (json.data) {
          setNetwork(json.data.wifi_network ?? "");
          setPassword(json.data.wifi_password ?? "");
          setNote(json.data.wifi_note ?? "");
        }
      } catch {
        if (!cancelled)
          setNotice({ type: "error", text: "Could not load current settings." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/park-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wifi_network: network,
          wifi_password: password,
          wifi_note: note,
        }),
      });
      const json: ApiResponse<ParkSettings> = await res.json();
      if (!res.ok || json.error) {
        setNotice({ type: "error", text: json.error ?? "Could not save." });
        return;
      }
      setNotice({ type: "success", text: "Wi-Fi info saved." });
    } catch {
      setNotice({ type: "error", text: "Could not reach the server." });
    } finally {
      setSaving(false);
    }
  }, [network, password, note]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-50">
          <Wifi className="h-5 w-5 text-gold-600" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wi-Fi Info</h1>
          <p className="text-sm text-sand-500">
            Shown to guests on their dashboard. Leave the network blank to hide
            the Wi-Fi card entirely.
          </p>
        </div>
      </div>

      {notice && (
        <div
          className={
            "rounded-xl border p-4 text-sm " +
            (notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700")
          }
        >
          {notice.text}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <Input
                label="Network name (SSID)"
                placeholder="e.g. Holiday-Guest"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              />
              <Input
                label="Password"
                placeholder="e.g. welcome2holiday"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Note (optional)"
                placeholder="e.g. Same password at the pool and clubhouse"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                helperText="Any extra instructions shown under the Wi-Fi details."
              />
              <Button
                variant="primary"
                className="w-full"
                loading={saving}
                disabled={saving}
                onClick={save}
              >
                Save Wi-Fi Info
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
