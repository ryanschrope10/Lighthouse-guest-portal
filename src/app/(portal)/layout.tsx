import { redirect } from "next/navigation";
import { GuestProvider, type GuestSession } from "@/lib/context/guest-context";
import type { Guest, Property } from "@/types/index";
import { PortalShell } from "./portal-shell";

// Check if Supabase is configured
function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && url.startsWith("http");
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let guest: Guest | null = null;
  let property: Property | null = null;
  let session: GuestSession = { id: "demo", email: "guest@demo.com" };

  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // Fetch guest profile
    const { data: guestData } = await supabase
      .from("guests")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    guest = guestData;

    // Fetch the guest's property (via their most recent booking, or a default)
    if (guest) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("property_id")
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (booking) {
        const { data: prop } = await supabase
          .from("properties")
          .select("*")
          .eq("id", booking.property_id)
          .single();

        property = prop;
      }
    }

    session = {
      id: user.id,
      email: user.email ?? "",
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
