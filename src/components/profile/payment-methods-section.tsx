"use client";

import { useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Zap,
  Save,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PaymentMethod } from "@/types/index";

const BRAND_OPTIONS = [
  { label: "Visa", value: "Visa" },
  { label: "Mastercard", value: "Mastercard" },
  { label: "Amex", value: "Amex" },
  { label: "Discover", value: "Discover" },
];

// Mock data
const MOCK_PAYMENTS: PaymentMethod[] = [
  {
    id: "pm1",
    guest_id: "g1",
    type: "credit_card",
    last_four: "4242",
    brand: "Visa",
    is_preferred: true,
    auto_pay_enabled: true,
    newbook_payment_token: null,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "pm2",
    guest_id: "g1",
    type: "credit_card",
    last_four: "8888",
    brand: "Mastercard",
    is_preferred: false,
    auto_pay_enabled: false,
    newbook_payment_token: null,
    created_at: "2025-03-15T00:00:00Z",
  },
];

interface PaymentForm {
  brand: string;
  last_four: string;
  expiry: string;
}

const emptyPaymentForm: PaymentForm = {
  brand: "Visa",
  last_four: "",
  expiry: "",
};

export function PaymentMethodsSection() {
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_PAYMENTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyPaymentForm);
  const [saving, setSaving] = useState(false);

  function togglePreferred(id: string) {
    setMethods((prev) =>
      prev.map((m) => ({
        ...m,
        is_preferred: m.id === id,
      })),
    );
    console.log("Set preferred payment method:", id);
  }

  function toggleAutoPay(id: string) {
    setMethods((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, auto_pay_enabled: !m.auto_pay_enabled } : m,
      ),
    );
    console.log("Toggle auto-pay for:", id);
  }

  function handleDelete(id: string) {
    if (window.confirm("Remove this payment method?")) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
      console.log("Deleting payment method:", id);
    }
  }

  async function handleAdd() {
    setSaving(true);
    console.log("Adding payment method:", form);
    await new Promise((r) => setTimeout(r, 600));

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      guest_id: "g1",
      type: "credit_card",
      last_four: form.last_four,
      brand: form.brand,
      is_preferred: methods.length === 0,
      auto_pay_enabled: false,
      newbook_payment_token: null,
      created_at: new Date().toISOString(),
    };

    setMethods((prev) => [...prev, newMethod]);
    setSaving(false);
    setShowForm(false);
    setForm(emptyPaymentForm);
  }

  return (
    <div className="space-y-4">
      {/* Payment methods list */}
      {methods.length === 0 && !showForm && (
        <div className="py-8 text-center text-sm text-sand-500">
          <CreditCard className="mx-auto mb-2 h-8 w-8 text-sand-300" />
          No payment methods saved.
        </div>
      )}

      {methods.map((method) => (
        <div
          key={method.id}
          className="rounded-lg border border-sand-200 bg-white p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand-100">
                <CreditCard className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-sand-900">
                    {method.brand} ****{method.last_four}
                  </p>
                  {method.is_preferred && (
                    <Badge status="success">Preferred</Badge>
                  )}
                </div>
                <p className="text-xs text-sand-500">Credit Card</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(method.id)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sand-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              aria-label="Delete payment method"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Toggles */}
          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-sand-100 pt-3">
            {/* Preferred toggle */}
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <button
                role="switch"
                aria-checked={method.is_preferred}
                onClick={() => togglePreferred(method.id)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  method.is_preferred ? "bg-gold-600" : "bg-sand-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                    method.is_preferred ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <Star className="h-3.5 w-3.5 text-sand-500" />
              <span className="text-sand-700">Preferred</span>
            </label>

            {/* Auto-pay toggle */}
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <button
                role="switch"
                aria-checked={method.auto_pay_enabled}
                onClick={() => toggleAutoPay(method.id)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  method.auto_pay_enabled ? "bg-gold-600" : "bg-sand-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                    method.auto_pay_enabled
                      ? "translate-x-4"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
              <Zap className="h-3.5 w-3.5 text-sand-500" />
              <span className="text-sand-700">Auto-Pay</span>
            </label>
          </div>
        </div>
      ))}

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border border-gold-200 bg-gold-50/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-sand-900">
              Add Payment Method
            </h4>
            <button
              onClick={() => {
                setShowForm(false);
                setForm(emptyPaymentForm);
              }}
              className="text-sand-500 hover:text-sand-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-sand-500">
            Actual payment processing will go through NewBook. This is a
            placeholder form.
          </p>

          <Select
            label="Card Brand"
            name="brand"
            options={BRAND_OPTIONS}
            value={form.brand}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, brand: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Last 4 Digits"
              name="last_four"
              value={form.last_four}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setForm((prev) => ({ ...prev, last_four: val }));
              }}
              placeholder="4242"
              maxLength={4}
            />
            <Input
              label="Expiry (MM/YY)"
              name="expiry"
              value={form.expiry}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d/]/g, "");
                if (val.length === 2 && !val.includes("/")) val += "/";
                setForm((prev) => ({ ...prev, expiry: val.slice(0, 5) }));
              }}
              placeholder="12/26"
              maxLength={5}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setForm(emptyPaymentForm);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              loading={saving}
              disabled={form.last_four.length !== 4}
            >
              <Save className="h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sand-300 py-3 text-sm font-medium text-gold-600 hover:border-gold-400 hover:bg-gold-50/50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Payment Method
        </button>
      )}
    </div>
  );
}
