import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AdminShell } from "./admin-shell";

// Server-side gate for the whole admin area. Fails closed: anything other
// than a signed-in user whose account carries role='admin' gets a 404, so
// the panel's existence isn't advertised to guests. Promote an account with:
//   update users set role = 'admin' where email = '<you>';
// Every /api/admin/* route enforces the same check independently.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    notFound();
  }

  return <AdminShell>{children}</AdminShell>;
}
