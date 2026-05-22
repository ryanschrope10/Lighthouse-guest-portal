/** Best-effort client IP + user-agent, captured on signatures/acks as proof. */
export function requestProof(request: Request): {
  ip: string;
  userAgent: string;
} {
  const fwd = request.headers.get("x-forwarded-for");
  const ip =
    (fwd ? fwd.split(",")[0]?.trim() : "") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return {
    ip,
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}
