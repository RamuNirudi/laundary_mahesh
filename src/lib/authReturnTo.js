// Shared by the auth pages (Login, Register, and any page that resumes a flow
// after sign-in, e.g. the MCP OAuth consent page). Keep the redirect
// validation in one place — it is security-sensitive and easy to drift.

// Resolve ?returnTo= to a safe same-origin path, else "/".
//
// The same-origin check alone is not enough: a value like /.//evil.com or
// /\evil.com parses same-origin but normalizes to a protocol-relative
// //evil.com when assigned to location.href — an open redirect. So require the
// resolved path to be exactly one leading slash (no "//" prefix, no backslash).
export function safeReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  // No explicit destination: the caller decides where to land (the auth
  // pages send users to their role home, which is the site root for customers).
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    // Only access_token/clear_access_token are still URL-read by app-params.js, but the
    // whole bootstrap set stays stripped: one going back to a URL read must not silently
    // become injectable again. Normal app-flow params (e.g. the OAuth consent ctx) are kept.
    for (const p of ["access_token", "clear_access_token", "app_id", "app_base_url", "functions_version", "from_url"]) {
      url.searchParams.delete(p);
    }
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}
// Where each role belongs after signing in. Customers land on the public
// homepage; staff go straight to their own portal, which is the only part of
// the app their routes allow.
export function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "service_boy") return "/serviceboy";
  return "/";
}
