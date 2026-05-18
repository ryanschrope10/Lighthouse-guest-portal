import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { getDemoGuest, getProperty } from "@/lib/newbook/data";
import { GuestProvider, type GuestSession } from "@/lib/context/guest-context";
import type { Guest, Property } from "@/types/index";
import { PortalShell } from "./portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let guest: Guest | null = null;
  let property: Property | null = null;
  let session: GuestSession = { id: "demo", email: "guest@demo.com" };

  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    // Allow demo mode in development
    if (process.env.NODE_ENV !== "development") {
      redirect("/login");
    }
  } else {
    // Session is tied to the Newbook demo guest; resolve identity and
    // property straight from Newbook (no portal user DB yet).
    try {
      guest = await getDemoGuest();
      property = getProperty();
    } catch (error) {
      console.error("Failed to resolve guest from Newbook:", error);
    }

    session = {
      id: payload.userId,
      email: payload.email,
    };
  }

  return (
    <GuestProvider guest={guest} property={property} session={session}>
      <PortalShell>{children}</PortalShell>
    </GuestProvider>
  );
}
