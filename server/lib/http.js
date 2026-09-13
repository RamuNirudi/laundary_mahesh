import { config } from "./env.js";

/**
 * Thrown by route handlers to return a specific status and message. Anything
 * else that escapes a handler becomes a 500 with a generic message so internal
 * details never reach the client.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new ApiError(400, message);
export const unauthorized = (message = "Authentication required.") => new ApiError(401, message);
export const forbidden = (message = "You do not have access to this resource.") =>
  new ApiError(403, message);
export const notFound = (message = "Not found.") => new ApiError(404, message);
export const conflict = (message) => new ApiError(409, message);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": config.clientOrigin,
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

export function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json", ...CORS_HEADERS });
  response.end(status === 204 ? "" : JSON.stringify(body));
}

/** Sends a binary payload (file downloads) with the same CORS headers. */
export function sendBuffer(response, status, buffer, { contentType, filename }) {
  response.writeHead(status, {
    ...CORS_HEADERS,
    "Content-Type": contentType,
    "Content-Length": buffer.length,
    "Content-Disposition": `attachment; filename="${filename}"`,
    // Without this the browser hides the header from fetch(), so the client
    // cannot read back the server-chosen filename.
    "Access-Control-Expose-Headers": "Content-Disposition",
  });
  response.end(buffer);
}

export async function readJsonBody(request) {
  // Collected as Buffers and decoded once at the end: coercing each chunk to a
  // string separately can split a multi-byte UTF-8 character across a chunk
  // boundary and corrupt it (an address or instruction with an en-dash, say).
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    chunks.push(chunk);
    size += chunk.length;
    // Guard against an unbounded body filling memory.
    if (size > 1_000_000) throw badRequest("Request body is too large.");
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw badRequest("Request body must be a JSON object.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw badRequest("Request body must be valid JSON.");
  }
}

// ---------------------------------------------------------------------------
// Field coercion helpers shared by every route.
// ---------------------------------------------------------------------------

export function requireString(value, field, { max = 255, min = 1 } = {}) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < min) throw badRequest(`${field} is required.`);
  if (text.length > max) throw badRequest(`${field} must be ${max} characters or fewer.`);
  return text;
}

export function optionalString(value, field, { max = 255, fallback = "" } = {}) {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  if (text.length > max) throw badRequest(`${field} must be ${max} characters or fewer.`);
  return text;
}

export function toMoney(value, field, { max = 10_000_000 } = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw badRequest(`${field} must be zero or more.`);
  if (amount > max) throw badRequest(`${field} is too large.`);
  return Math.round(amount * 100) / 100;
}

export function toInteger(value, field, { min = 0, max = 1_000_000 } = {}) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) throw badRequest(`${field} must be a number.`);
  if (number < min || number > max) throw badRequest(`${field} must be between ${min} and ${max}.`);
  return number;
}

export const toBoolean = (value, fallback = false) =>
  value === undefined || value === null ? fallback : value === true || value === "true" || value === 1;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDate(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest(`${field} is required.`);
    return null;
  }
  const text = String(value).slice(0, 10);
  if (!DATE_PATTERN.test(text) || Number.isNaN(Date.parse(text))) {
    throw badRequest(`${field} must be a valid date (YYYY-MM-DD).`);
  }
  return text;
}

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Today in the server's local timezone as YYYY-MM-DD, for date-only columns. */
export function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
