"use client";

import { useState } from "react";
import {
  Baby,
  PawPrint,
  Tent,
  Accessibility,
  Plus,
  Trash2,
  Save,
  Pencil,
  X,
} from "lucide-react";
import { useGuest } from "@/lib/context/guest-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PetInfo } from "@/types/index";

interface PreferencesForm {
  kids_count: number;
  kids_ages: string; // comma-separated for easy editing
  pets: PetInfo[];
  site_preferences: string;
  special_needs: string;
}

export function PreferencesSection() {
  const { guest } = useGuest();

  const initialForm: PreferencesForm = {
    kids_count: guest?.preferences?.kids_count ?? 0,
    kids_ages: (guest?.preferences?.kids_ages ?? []).join(", "),
    pets: guest?.preferences?.pets ?? [
      { type: "Dog", breed: "Golden Retriever", name: "Buddy" },
    ],
    site_preferences: guest?.preferences?.site_preferences ?? "",
    special_needs: guest?.preferences?.special_needs ?? "",
  };

  const [form, setForm] = useState<PreferencesForm>(initialForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof PreferencesForm>(
    key: K,
    value: PreferencesForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPet() {
    setForm((prev) => ({
      ...prev,
      pets: [...prev.pets, { type: "", breed: "", name: "" }],
    }));
  }

  function removePet(index: number) {
    setForm((prev) => ({
      ...prev,
      pets: prev.pets.filter((_, i) => i !== index),
    }));
  }

  function updatePet(index: number, field: keyof PetInfo, value: string) {
    setForm((prev) => ({
      ...prev,
      pets: prev.pets.map((pet, i) =>
        i === index ? { ...pet, [field]: value } : pet,
      ),
    }));
  }

  function handleCancel() {
    setForm(initialForm);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    console.log("Saving preferences:", {
      ...form,
      kids_ages: form.kids_ages
        .split(",")
        .map((a) => parseInt(a.trim()))
        .filter((n) => !isNaN(n)),
    });
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Edit toggle */}
      <div className="flex items-center justify-end">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 hover:text-sand-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
      </div>

      {/* Kids */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sand-700">
          <Baby className="h-4 w-4" />
          <span className="text-sm font-medium">Children</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Number of Kids"
            name="kids_count"
            type="number"
            min={0}
            value={form.kids_count.toString()}
            onChange={(e) =>
              updateField("kids_count", parseInt(e.target.value) || 0)
            }
            disabled={!editing}
          />
          <Input
            label="Ages (comma separated)"
            name="kids_ages"
            value={form.kids_ages}
            onChange={(e) => updateField("kids_ages", e.target.value)}
            disabled={!editing}
            placeholder="3, 7, 12"
          />
        </div>
      </div>

      {/* Pets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sand-700">
          <PawPrint className="h-4 w-4" />
          <span className="text-sm font-medium">Pets</span>
        </div>

        {form.pets.length === 0 && !editing && (
          <p className="text-sm text-sand-500">No pets listed.</p>
        )}

        {form.pets.map((pet, index) => (
          <div
            key={index}
            className="flex items-start gap-2"
          >
            <div className="grid flex-1 grid-cols-3 gap-2">
              <Input
                name={`pet_type_${index}`}
                value={pet.type}
                onChange={(e) => updatePet(index, "type", e.target.value)}
                disabled={!editing}
                placeholder="Dog"
              />
              <Input
                name={`pet_breed_${index}`}
                value={pet.breed ?? ""}
                onChange={(e) => updatePet(index, "breed", e.target.value)}
                disabled={!editing}
                placeholder="Breed"
              />
              <Input
                name={`pet_name_${index}`}
                value={pet.name ?? ""}
                onChange={(e) => updatePet(index, "name", e.target.value)}
                disabled={!editing}
                placeholder="Name"
              />
            </div>
            {editing && (
              <button
                onClick={() => removePet(index)}
                className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Remove pet"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {editing && (
          <button
            onClick={addPet}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Pet
          </button>
        )}
      </div>

      {/* Site Preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sand-700">
          <Tent className="h-4 w-4" />
          <span className="text-sm font-medium">Site Preferences</span>
        </div>
        <Textarea
          name="site_preferences"
          value={form.site_preferences}
          onChange={(e) => updateField("site_preferences", e.target.value)}
          disabled={!editing}
          placeholder="e.g., Prefer shady spots, near restrooms, pull-through site..."
          className="min-h-[80px]"
        />
      </div>

      {/* Special Needs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sand-700">
          <Accessibility className="h-4 w-4" />
          <span className="text-sm font-medium">Special Needs</span>
        </div>
        <Textarea
          name="special_needs"
          value={form.special_needs}
          onChange={(e) => updateField("special_needs", e.target.value)}
          disabled={!editing}
          placeholder="e.g., Wheelchair accessible, ADA requirements..."
          className="min-h-[80px]"
        />
      </div>

      {/* Save */}
      {editing && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
}
