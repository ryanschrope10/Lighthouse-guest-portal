"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  defaultValue,
  value: controlledValue,
  onChange,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue || tabs[0]?.value || "",
  );

  const activeValue = controlledValue ?? internalValue;

  function handleSelect(value: string) {
    if (controlledValue === undefined) {
      setInternalValue(value);
    }
    onChange?.(value);
  }

  return (
    <div
      className={clsx(
        "flex gap-1 border-b border-sand-200 overflow-x-auto",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeValue === tab.value}
          onClick={() => handleSelect(tab.value)}
          className={clsx(
            "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
            activeValue === tab.value
              ? "text-gold-700"
              : "text-sand-500 hover:text-sand-700",
          )}
        >
          {tab.label}
          {activeValue === tab.value && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gold-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  value: string;
  activeValue: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({
  value,
  activeValue,
  children,
  className,
}: TabPanelProps) {
  if (value !== activeValue) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
