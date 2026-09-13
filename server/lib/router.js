// A tiny pattern router over node:http, so the API stays dependency-free.
// Patterns use `:name` segments, e.g. "/api/admin/coupons/:id".

import { notFound } from "./http.js";

export function createRouter() {
  const routes = [];

  const add = (method, pattern, handler) => {
    const segments = pattern.split("/").filter(Boolean);
    routes.push({ method, segments, handler });
  };

  return {
    get: (pattern, handler) => add("GET", pattern, handler),
    post: (pattern, handler) => add("POST", pattern, handler),
    put: (pattern, handler) => add("PUT", pattern, handler),
    patch: (pattern, handler) => add("PATCH", pattern, handler),
    delete: (pattern, handler) => add("DELETE", pattern, handler),

    /** Returns { handler, params }, or throws 404 / 405 when nothing matches. */
    resolve(method, pathname) {
      const parts = pathname.split("/").filter(Boolean);
      let pathMatched = false;

      for (const route of routes) {
        if (route.segments.length !== parts.length) continue;
        const params = {};
        const matches = route.segments.every((segment, index) => {
          if (segment.startsWith(":")) {
            params[segment.slice(1)] = decodeURIComponent(parts[index]);
            return true;
          }
          return segment === parts[index];
        });
        if (!matches) continue;
        pathMatched = true;
        if (route.method === method) return { handler: route.handler, params };
      }

      throw notFound(
        pathMatched ? `${method} is not allowed on this route.` : "API route not found.",
      );
    },
  };
}
