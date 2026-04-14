"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { Guest, Property } from "@/types/index";

export interface GuestSession {
  id: string;
  email: string;
}

export interface GuestContextValue {
  guest: Guest | null;
  property: Property | null;
  session: GuestSession | null;
}

const GuestContext = createContext<GuestContextValue>({
  guest: null,
  property: null,
  session: null,
});

interface GuestProviderProps {
  children: ReactNode;
  guest: Guest | null;
  property: Property | null;
  session: GuestSession | null;
}

export function GuestProvider({
  children,
  guest,
  property,
  session,
}: GuestProviderProps) {
  return (
    <GuestContext.Provider value={{ guest, property, session }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest(): GuestContextValue {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error("useGuest must be used within a GuestProvider");
  }
  return context;
}
