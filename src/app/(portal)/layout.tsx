import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
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
    // Fetch user from Neon
    const rows = await sql`SELECT * FROM users WHERE id = ${payload.userId}`;
    const user = rows[0];

    if (user) {
      guest = {
        id: user.id,
        auth_user_id: user.id,
        newbook_guest_id: user.newbook_guest_id ?? null,
        email: user.email,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        phone: user.phone ?? null,
        address: user.address ?? {},
        preferences: user.preferences ?? {},
        created_at: user.created_at?.toISOString?.() ?? new Date().toISOString(),
        updated_at: user.updated_at?.toISOString?.() ?? new Date().toISOString(),
      };

      // Fetch the user's property via their most recent booking
      // Wrapped in try/catch — these tables may not exist yet
      try {
        const bookings = await sql`
          SELECT property_id FROM bookings
          WHERE guest_id = ${user.id}
          ORDER BY created_at DESC
          LIMIT 1
        `;

        if (bookings[0]) {
          const properties = await sql`
            SELECT * FROM properties
            WHERE id = ${bookings[0].property_id}
          `;
          property = (properties[0] as Property) ?? null;
        }
      } catch {
        // bookings/properties tables may not exist yet — skip
      }
    }

    session = {
      id: payload.userId,
      email: payload.email,
    };
  }

  return (
    <GuestProvider guest={guest} property={property} session={session}>
      <PortalShell guestName={guest?.first_name ?? "Guest"}>
        {children}
      </PortalShell>
    </GuestProvider>
  );
}
