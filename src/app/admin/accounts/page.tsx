"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { KeyRound, Copy, Check, AlertTriangle, Users } from "lucide-react";
import clsx from "clsx";
import type { ApiResponse } from "@/types/index";
import type { PortalUserRow } from "@/app/api/admin/users/route";
import type { ResetLinkResponse } from "@/app/api/admin/users/[id]/reset-link/route";

function fullName(u: PortalUserRow): string {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
}

export default function AdminAccountsPage() {
  const [users, setUsers] = useState<PortalUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issued, setIssued] = useState<ResetLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const json: ApiResponse<PortalUserRow[]> = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Failed to load accounts.");
        setUsers([]);
        return;
      }
      setUsers(json.data);
    } catch {
      setError("Could not reach the server.");
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generate(user: PortalUserRow) {
    setBusyId(user.id);
    setError(null);
    setIssued(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-link`, {
        method: "POST",
      });
      const json: ApiResponse<ResetLinkResponse> = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Could not create a reset link.");
        return;
      }
      setIssued(json.data);
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Guest Accounts</h1>
        <p className="mt-1 text-sm text-sand-500">
          Portal sign-ins. Use this to issue a password reset link when a guest
          is locked out — there&apos;s no automatic reset email, so hand them
          the link yourself.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {issued && (
        <div className="mb-6 rounded-xl border border-gold-300 bg-gold-50 p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gold-700" />
            <p className="text-sm font-semibold text-gray-900">
              Reset link for {issued.email}
            </p>
          </div>
          <p className="mt-1 text-xs text-sand-600">
            Single use, expires in {issued.expires_in_minutes} minutes (
            {format(parseISO(issued.expires_at), "h:mm a")}). Give it to the
            guest now — it won&apos;t be shown again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              value={issued.url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-sand-300 bg-white px-3 py-2 font-mono text-xs text-sand-800"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(issued.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Clipboard blocked; the field is selectable instead.
                }
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50/50 text-left text-xs font-semibold uppercase tracking-wide text-sand-600">
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Newbook ID</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Password</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {users === null && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-sand-500">
                  Loading…
                </td>
              </tr>
            )}
            {users?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-sand-500">
                  No portal accounts yet.
                </td>
              </tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} className="text-sm">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">
                    {fullName(u)}
                  </span>
                  {u.role === "admin" && (
                    <span className="ml-2 rounded bg-sand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sand-600">
                      Staff
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sand-700">{u.email}</td>
                <td className="px-4 py-3 text-sand-500">
                  {u.newbook_guest_id ?? "—"}
                </td>
                <td className="px-4 py-3 text-sand-500">
                  {format(new Date(u.created_at), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {u.reset_pending && !issued && (
                      <span className="text-xs text-sand-500">
                        link outstanding
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => generate(u)}
                      disabled={busyId === u.id}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-medium transition-colors",
                        busyId === u.id
                          ? "opacity-60"
                          : "text-sand-700 hover:bg-sand-50",
                      )}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {busyId === u.id ? "Creating…" : "Reset link"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-sand-200 bg-sand-50/60 p-4">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-sand-400" />
        <div className="text-sm text-sand-600">
          <p className="font-medium text-sand-800">How guests get an account</p>
          <p className="mt-1">
            They register themselves at <code>/register</code> using the email
            on their Newbook record — it has to match exactly, or signup is
            refused. Nothing needs creating here first.
          </p>
        </div>
      </div>
    </div>
  );
}
