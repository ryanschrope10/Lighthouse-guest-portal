"use client";

import { useState } from "react";
import {
  User,
  Truck,
  Heart,
  FileText,
  CreditCard,
  Settings,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { useGuest } from "@/lib/context/guest-context";
import { ContactDetails } from "@/components/profile/contact-details";
import { VehiclesSection } from "@/components/profile/vehicles-section";
import { PreferencesSection } from "@/components/profile/preferences-section";
import { DocumentsSummary } from "@/components/profile/documents-summary";
import { PaymentMethodsSection } from "@/components/profile/payment-methods-section";
import { AccountSettings } from "@/components/profile/account-settings";

type SectionId =
  | "contact"
  | "vehicles"
  | "preferences"
  | "documents"
  | "payments"
  | "account";

interface Section {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const SECTIONS: Section[] = [
  {
    id: "contact",
    label: "Contact Details",
    icon: User,
    component: ContactDetails,
  },
  {
    id: "vehicles",
    label: "Vehicles & Equipment",
    icon: Truck,
    component: VehiclesSection,
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: Heart,
    component: PreferencesSection,
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    component: DocumentsSummary,
  },
  {
    id: "payments",
    label: "Payment Methods",
    icon: CreditCard,
    component: PaymentMethodsSection,
  },
  {
    id: "account",
    label: "Account Settings",
    icon: Settings,
    component: AccountSettings,
  },
];

export default function ProfilePage() {
  const { guest, session } = useGuest();
  const [activeSection, setActiveSection] = useState<SectionId>("contact");
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(["contact"]),
  );

  function toggleAccordion(id: SectionId) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const ActiveComponent =
    SECTIONS.find((s) => s.id === activeSection)?.component ?? ContactDetails;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sand-900">My Profile</h1>
        <p className="mt-1 text-sm text-sand-500">
          Manage your personal information, vehicles, and preferences.
        </p>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Sidebar nav */}
        <nav className="space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gold-50 text-gold-700"
                    : "text-sand-600 hover:bg-sand-50 hover:text-sand-900",
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5",
                    isActive ? "text-gold-600" : "text-sand-400",
                  )}
                />
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* Content area */}
        <div className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-sand-900">
            {SECTIONS.find((s) => s.id === activeSection)?.label}
          </h2>
          <ActiveComponent />
        </div>
      </div>

      {/* Mobile: accordion */}
      <div className="space-y-3 lg:hidden">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          const Component = section.component;

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm"
            >
              {/* Accordion trigger */}
              <button
                onClick={() => toggleAccordion(section.id)}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      "h-5 w-5",
                      isExpanded ? "text-gold-600" : "text-sand-400",
                    )}
                  />
                  <span
                    className={clsx(
                      "text-sm font-semibold",
                      isExpanded ? "text-gold-700" : "text-sand-800",
                    )}
                  >
                    {section.label}
                  </span>
                </div>
                <ChevronDown
                  className={clsx(
                    "h-4 w-4 text-sand-400 transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>

              {/* Accordion content */}
              {isExpanded && (
                <div className="border-t border-sand-100 px-4 pb-5 pt-4">
                  <Component />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
