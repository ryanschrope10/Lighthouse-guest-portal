"use client";

import { useState } from "react";
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/types/index";

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

// Mock data
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    guest_id: "g1",
    property_id: "p1",
    type: "rv",
    make: "Winnebago",
    model: "View 24D",
    year: 2022,
    license_plate: "TX-RV-4521",
    length_ft: 25,
    details: {},
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "v2",
    guest_id: "g1",
    property_id: "p1",
    type: "vehicle",
    make: "Ford",
    model: "F-150",
    year: 2023,
    license_plate: "TX-123-ABC",
    length_ft: null,
    details: {},
    created_at: "2025-02-10T00:00:00Z",
  },
];

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
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  function handleDelete(id: string) {
    if (window.confirm("Remove this vehicle?")) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      console.log("Deleting vehicle:", id);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    setSaving(true);
    console.log("Saving vehicle:", form);
    await new Promise((r) => setTimeout(r, 600));

    if (editingId) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === editingId
            ? {
                ...v,
                type: form.type,
                make: form.make || null,
                model: form.model || null,
                year: form.year ? parseInt(form.year) : null,
                license_plate: form.license_plate || null,
                length_ft: form.length_ft ? parseInt(form.length_ft) : null,
              }
            : v,
        ),
      );
    } else {
      const newVehicle: Vehicle = {
        id: `v-${Date.now()}`,
        guest_id: "g1",
        property_id: "p1",
        type: form.type,
        make: form.make || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
        license_plate: form.license_plate || null,
        length_ft: form.length_ft ? parseInt(form.length_ft) : null,
        details: {},
        created_at: new Date().toISOString(),
      };
      setVehicles((prev) => [...prev, newVehicle]);
    }

    setSaving(false);
    handleCancel();
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-4">
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
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
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
    </div>
  );
}
