"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, Building2 } from "lucide-react";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type PaymentMethodType = "credit_card" | "ach";

export interface NewPaymentMethodData {
  type: PaymentMethodType;
  // Card fields
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  // ACH fields
  routingNumber?: string;
  accountNumber?: string;
}

interface PaymentMethodFormProps {
  onSubmit: (data: NewPaymentMethodData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function PaymentMethodForm({
  onSubmit,
  onCancel,
  loading = false,
}: PaymentMethodFormProps) {
  const [type, setType] = useState<PaymentMethodType>("credit_card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (type === "credit_card") {
      const rawCard = cardNumber.replace(/\s/g, "");
      if (!rawCard || rawCard.length < 13 || rawCard.length > 16) {
        newErrors.cardNumber = "Enter a valid card number";
      }
      const rawExpiry = expiry.replace("/", "");
      if (!rawExpiry || rawExpiry.length !== 4) {
        newErrors.expiry = "Enter a valid expiry (MM/YY)";
      } else {
        const month = parseInt(rawExpiry.slice(0, 2), 10);
        if (month < 1 || month > 12) {
          newErrors.expiry = "Invalid month";
        }
      }
      if (!cvv || cvv.length < 3 || cvv.length > 4) {
        newErrors.cvv = "Enter a valid CVV";
      }
    } else {
      if (!routingNumber || routingNumber.length !== 9) {
        newErrors.routingNumber = "Routing number must be 9 digits";
      }
      if (!accountNumber || accountNumber.length < 4) {
        newErrors.accountNumber = "Enter a valid account number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (type === "credit_card") {
      onSubmit({ type, cardNumber, expiry, cvv });
    } else {
      onSubmit({ type, routingNumber, accountNumber });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setType("credit_card");
            setErrors({});
          }}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
            type === "credit_card"
              ? "border-gold-500 bg-gold-50 text-gold-700 ring-1 ring-gold-500/30"
              : "border-sand-300 bg-white text-sand-600 hover:bg-sand-50",
          )}
        >
          <CreditCard className="h-4 w-4" />
          Credit Card
        </button>
        <button
          type="button"
          onClick={() => {
            setType("ach");
            setErrors({});
          }}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
            type === "ach"
              ? "border-gold-500 bg-gold-50 text-gold-700 ring-1 ring-gold-500/30"
              : "border-sand-300 bg-white text-sand-600 hover:bg-sand-50",
          )}
        >
          <Building2 className="h-4 w-4" />
          Bank Account
        </button>
      </div>

      {/* Card fields */}
      {type === "credit_card" && (
        <>
          <Input
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            error={errors.cardNumber}
            inputMode="numeric"
            maxLength={19}
            autoComplete="cc-number"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                error={errors.expiry}
                inputMode="numeric"
                maxLength={5}
                autoComplete="cc-exp"
              />
            </div>
            <div className="w-24">
              <Input
                label="CVV"
                placeholder="123"
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                error={errors.cvv}
                inputMode="numeric"
                maxLength={4}
                type="password"
                autoComplete="cc-csc"
              />
            </div>
          </div>
        </>
      )}

      {/* ACH fields */}
      {type === "ach" && (
        <>
          <Input
            label="Routing Number"
            placeholder="123456789"
            value={routingNumber}
            onChange={(e) =>
              setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))
            }
            error={errors.routingNumber}
            inputMode="numeric"
            maxLength={9}
          />
          <Input
            label="Account Number"
            placeholder="Account number"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 17))
            }
            error={errors.accountNumber}
            inputMode="numeric"
            type="password"
          />
        </>
      )}

      <p className="text-xs text-sand-500">
        Payment processing is handled securely by NewBook. Card details are
        tokenized and never stored directly.
      </p>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          Save Payment Method
        </Button>
      </div>
    </form>
  );
}
