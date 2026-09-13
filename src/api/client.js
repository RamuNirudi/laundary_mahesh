// Shared fetch wrapper for the Node.js API. Every client module in src/api
// goes through `request`, so auth headers and error handling live in one place.

const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/$/, "");
const TOKEN_KEY = "laundry_access_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function request(path, { method = "GET", body, query } = {}) {
  const token = getToken();
  const search = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""))}`
    : "";

  let response;
  try {
    response = await fetch(`${API_URL}${path}${search}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects when the request never reached the server.
    throw new Error("Cannot reach the server. Check that the API is running.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // An expired or revoked token should not leave the app in a half-signed-in
    // state where every later call fails the same way.
    if (response.status === 401 && token) clearToken();
    throw new Error(data.message || `Request failed (${response.status}).`);
  }
  return data;
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

/**
 * Downloads a file from an authenticated endpoint. The token lives in
 * localStorage, not a cookie, so a plain <a href> cannot fetch it — the file is
 * pulled as a blob and handed to a temporary link instead.
 */
export async function downloadFile(path, query, fallbackName) {
  const token = getToken();
  const search = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== ""))}`
    : "";

  const response = await fetch(`${API_URL}${path}${search}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Download failed (${response.status}).`);
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = match?.[1] || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
