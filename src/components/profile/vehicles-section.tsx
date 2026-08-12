"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, isValid, differenceInCalendarDays } from "date-fns";
import { useGuest } from "@/lib/context/guest-context";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type {
  Vehicle,
  BookingEquipment,
  InsurancePolicy,
  ApiResponse,
} from "@/types/index";

// Safely format an ISO date string; returns null for empty/invalid input.
function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return null;
  return format(parsed, "MMM d, yyyy");
}

// Returns "expired" | "soon" | null relative to today (30-day window).
function expiryStatus(value: string | null | undefined): "expired" | "soon" | null {
  if (!value) return null;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return null;
  const days = differenceInCalendarDays(parsed, new Date());
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return null;
}

const VEHICLE_TYPE_OPTIONS = [
  { label: "RV", value: "rv" },
  { label: "Trailer", value: "trailer" },
  { label: "Motorhome", value: "motorhome" },
  { label: "Vehicle", value: "vehicle" },
  { label: "Other", value: "other" },
];

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  rv: "RV",
  trailer: "Trailer",
  motorhome: "Motorhome",
  vehicle: "Vehicle",
  other: "Other",
};

interface VehicleForm {
  type: Vehicle["type"];
  make: string;
  model: string;
  year: string;
  license_plate: string;
  length_ft: string;
}

const emptyForm: VehicleForm = {
  type: "rv",
  make: "",
  model: "",
  year: "",
  license_plate: "",
  length_ft: "",
};

export function VehiclesSection() {
  const { guest } = useGuest();
  const equipment = guest?.equipment ?? [];
  const insurancePolicies = guest?.insurance_policies ?? [];

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Inline confirmation instead of window.confirm — a native dialog is a poor
  // fit on phones, which is how most guests use the portal.
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/guest/vehicles");
        const json: ApiResponse<Vehicle[]> = await res.json();
        if (cancelled) return;
        if (!res.ok || json.error || !json.data) {
          setError(json.error ?? "We couldn't load your vehicles.");
          return;
        }
        setVehicles(json.data);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateForm<K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleEdit(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setForm({
      type: vehicle.type,
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      year: vehicle.year?.toString() ?? "",
      license_plate: vehicle.license_plate ?? "",
      length_ft: vehicle.length_ft?.toString() ?? "",
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    setConfirmingDeleteId(null);
    const previous = vehicles;
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    try {
      const res = await fetch(`/api/guest/vehicles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setVehicles(previous);
      setError("We couldn't remove that vehicle. Please try again.");
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = {
      type: form.type,
      make: form.make || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      license_plate: form.license_plate || null,
      length_ft: form.length_ft ? parseInt(form.length_ft) : null,
    };

    try {
      const res = await fetch(
        editingId ? `/api/guest/vehicles/${editingId}` : "/api/guest/vehicles",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json: ApiResponse<Vehicle> = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "We couldn't save that vehicle.");
        return;
      }
      const saved = json.data;
      setVehicles((prev) =>
        editingId
          ? prev.map((v) => (v.id === editingId ? saved : v))
          : [...prev, saved],
      );
      handleCancel();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Vehicle list */}
      {vehicles.length === 0 && !showForm && (
        <div className="py-8 text-center text-sm text-sand-500">
          <Truck className="mx-auto mb-2 h-8 w-8 text-sand-300" />
          No vehicles registered yet.
        </div>
      )}

      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="rounded-lg border border-sand-200 bg-sand-50/50"
        >
          {/* Summary row */}
          <button
            onClick={() => toggleExpand(vehicle.id)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gold-600" />
              <div>
                <p className="text-sm font-medium text-sand-900">
                  {vehicle.year ? `${vehicle.year} ` : ""}
                  {vehicle.make ?? ""} {vehicle.model ?? ""}
                </p>
                <p className="text-xs text-sand-500">
                  {VEHICLE_TYPE_LABELS[vehicle.type]}
                  {vehicle.license_plate ? ` \u00B7 ${vehicle.license_plate}` : ""}
                </p>
              </div>
            </div>
            {expandedId === vehicle.id ? (
              <ChevronUp className="h-4 w-4 text-sand-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-sand-400" />
            )}
          </button>

          {/* Expanded details */}
          {expandedId === vehicle.id && (
            <div className="border-t border-sand-200 px-4 py-3 space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-sand-500">Type</span>
                  <p className="font-medium text-sand-900">
                    {VEHICLE_TYPE_LABELS[vehicle.type]}
                  </p>
                </div>
                <div>
                  <span className="text-sand-500">Year</span>
                  <p className="font-medium text-sand-900">
                    {vehicle.year ?? "--"}
                  </p>
                </div>
                <div>
                  <span className="text-sand-500">Make / Model</span>
                  <p className="font-medium text-sand-900">
                    {vehicle.make ?? "--"} {vehicle.model ?? ""}
                  </p>
                </div>
                <div>
                  <span className="text-sand-500">License Plate</span>
                  <p className="font-medium text-sand-900">
                    {vehicle.license_plate ?? "--"}
                  </p>
                </div>
                {vehicle.length_ft && (
                  <div>
                    <span className="text-sand-500">Length</span>
                    <p className="font-medium text-sand-900">
                      {vehicle.length_ft} ft
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gold-600 hover:bg-gold-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                {confirmingDeleteId === vehicle.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-sand-600 hover:bg-sand-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmingDeleteId(vehicle.id)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-lg border border-gold-200 bg-gold-50/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-sand-900">
              {editingId ? "Edit Vehicle" : "New Vehicle"}
            </h4>
            <button
              onClick={handleCancel}
              className="text-sand-500 hover:text-sand-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Select
            label="Vehicle Type"
            name="vehicle_type"
            options={VEHICLE_TYPE_OPTIONS}
            value={form.type}
            onChange={(e) =>
              updateForm("type", e.target.value as Vehicle["type"])
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Make"
              name="make"
              value={form.make}
              onChange={(e) => updateForm("make", e.target.value)}
              placeholder="Winnebago"
            />
            <Input
              label="Model"
              name="model"
              value={form.model}
              onChange={(e) => updateForm("model", e.target.value)}
              placeholder="View 24D"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Input
              label="Year"
              name="year"
              type="number"
              value={form.year}
              onChange={(e) => updateForm("year", e.target.value)}
              placeholder="2024"
            />
            <Input
              label="License Plate"
              name="license_plate"
              value={form.license_plate}
              onChange={(e) => updateForm("license_plate", e.target.value)}
              placeholder="TX-123-ABC"
            />
            <Input
              label="Length (ft)"
              name="length_ft"
              type="number"
              value={form.length_ft}
              onChange={(e) => updateForm("length_ft", e.target.value)}
              placeholder="25"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              {editingId ? "Update" : "Add Vehicle"}
            </Button>
          </div>
        </div>
      )}

      {/* Add vehicle button */}
      {!showForm && (
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sand-300 py-3 text-sm font-medium text-gold-600 hover:border-gold-400 hover:bg-gold-50/50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      )}

      {/* Equipment on file with the park (read-only, from Newbook reservation) */}
      {equipment.length > 0 && (
        <div className="space-y-3 border-t border-sand-200 pt-5">
          <div className="flex items-center gap-2 text-sand-700">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">On file with the park</span>
          </div>
          <p className="text-xs text-sand-500">
            From your reservation. To change these, contact the park office.
          </p>
          {equipment.map((rig, i) => (
            <EquipmentCard key={i} rig={rig} />
          ))}
        </div>
      )}

      {/* Insurance policies (read-only) */}
      {insurancePolicies.length > 0 && (
        <div className="space-y-3 border-t border-sand-200 pt-5">
          <div className="flex items-center gap-2 text-sand-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Insurance Policies</span>
          </div>
          {insurancePolicies.map((policy, i) => (
            <InsuranceCard key={i} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}

function EquipmentCard({ rig }: { rig: BookingEquipment }) {
  const title =
    rig.name ||
    [rig.make, rig.model].filter(Boolean).join(" ") ||
    "Equipment";
  const dims = [
    rig.length_ft != null ? `${rig.length_ft} ft L` : null,
    rig.width_ft != null ? `${rig.width_ft} ft W` : null,
    rig.height_ft != null ? `${rig.height_ft} ft H` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const regExpiry = formatDate(rig.registration_expires);
  const regStatus = expiryStatus(rig.registration_expires);

  return (
    <div className="rounded-lg border border-sand-200 bg-sand-50/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Truck className="h-5 w-5 text-sand-400" />
        <div>
          <p className="text-sm font-medium text-sand-900">{title}</p>
          {rig.type && <p className="text-xs text-sand-500">{rig.type}</p>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {(rig.make || rig.model) && (
          <div>
            <span className="text-sand-500">Make / Model</span>
            <p className="font-medium text-sand-900">
              {[rig.make, rig.model].filter(Boolean).join(" ")}
            </p>
          </div>
        )}
        {dims && (
          <div>
            <span className="text-sand-500">Dimensions</span>
            <p className="font-medium text-sand-900">{dims}</p>
          </div>
        )}
        {rig.registration && (
          <div>
            <span className="text-sand-500">Registration</span>
            <p className="font-medium text-sand-900">{rig.registration}</p>
          </div>
        )}
        {regExpiry && (
          <div>
            <span className="text-sand-500">Reg. Expires</span>
            <p className="flex items-center gap-1.5 font-medium text-sand-900">
              {regExpiry}
              {regStatus && (
                <Badge status={regStatus === "expired" ? "danger" : "warning"}>
                  {regStatus === "expired" ? "Expired" : "Soon"}
                </Badge>
              )}
            </p>
          </div>
        )}
        {rig.slideouts && (
          <div>
            <span className="text-sand-500">Slideouts</span>
            <p className="font-medium text-sand-900">{rig.slideouts}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InsuranceCard({ policy }: { policy: InsurancePolicy }) {
  const expiry = formatDate(policy.expires_at);
  const status = expiryStatus(policy.expires_at);

  return (
    <div className="rounded-lg border border-sand-200 bg-sand-50/50 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-sand-900">
          {policy.provider || "Insurance policy"}
        </p>
        {status && (
          <Badge status={status === "expired" ? "danger" : "warning"}>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {status === "expired" ? "Expired" : "Expiring soon"}
          </Badge>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {policy.policy_number && (
          <div>
            <span className="text-sand-500">Policy #</span>
            <p className="font-medium text-sand-900">{policy.policy_number}</p>
          </div>
        )}
        {policy.type && (
          <div>
            <span className="text-sand-500">Type</span>
            <p className="font-medium text-sand-900">{policy.type}</p>
          </div>
        )}
        {expiry && (
          <div>
            <span className="text-sand-500">Expires</span>
            <p className="font-medium text-sand-900">{expiry}</p>
          </div>
        )}
      </div>
    </div>
  );
}
