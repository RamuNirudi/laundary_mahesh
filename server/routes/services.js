import { database, newId } from "../lib/db.js";
import { requireRole } from "../lib/auth.js";
import {
  conflict,
  notFound,
  optionalString,
  requireString,
  toBoolean,
  toInteger,
  toMoney,
} from "../lib/http.js";

const PRICE_UNITS = ["per item", "per kg", "per piece", "fixed"];

const serialize = (service) => ({
  ...service,
  active: Boolean(service.active),
  price: Number(service.price),
  sort_order: Number(service.sort_order),
});

function readServiceInput(body, existing = {}) {
  const priceUnit = optionalString(body.price_unit, "Price unit", {
    max: 32,
    fallback: existing.price_unit || "per item",
  });
  return {
    name: requireString(body.name ?? existing.name, "Service name", { max: 120 }),
    description: optionalString(body.description, "Description", {
      max: 2000,
      fallback: existing.description || "",
    }),
    image: optionalString(body.image, "Image URL", { max: 1024, fallback: existing.image || "" }),
    icon: optionalString(body.icon, "Icon", { max: 64, fallback: existing.icon || "" }),
    category: optionalString(body.category, "Category", {
      max: 64,
      fallback: existing.category || "General",
    }),
    price: toMoney(body.price ?? existing.price ?? 0, "Price"),
    price_unit: PRICE_UNITS.includes(priceUnit) ? priceUnit : "per item",
    active: toBoolean(body.active, existing.active === undefined ? true : Boolean(existing.active)),
    sort_order: toInteger(body.sort_order ?? existing.sort_order ?? 0, "Sort order", {
      min: 0,
      max: 9999,
    }),
  };
}

async function loadService(id) {
  const [rows] = await database.execute("SELECT * FROM services WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw notFound("Service not found.");
  return rows[0];
}

export function registerServiceRoutes(router) {
  // Public catalogue - active services only.
  router.get("/api/services", async () => {
    const [services] = await database.execute(
      "SELECT * FROM services WHERE active = TRUE ORDER BY sort_order ASC, name ASC",
    );
    return { body: { services: services.map(serialize) } };
  });

  // Admin catalogue - includes disabled services.
  router.get("/api/admin/services", async (context) => {
    requireRole(context, "admin");
    const [services] = await database.execute(
      "SELECT * FROM services ORDER BY sort_order ASC, name ASC",
    );
    return { body: { services: services.map(serialize) } };
  });

  router.post("/api/admin/services", async (context) => {
    requireRole(context, "admin");
    const input = readServiceInput(context.body);
    const id = newId();
    await database.execute(
      `INSERT INTO services (id, name, description, image, icon, category, price, price_unit, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description,
        input.image,
        input.icon,
        input.category,
        input.price,
        input.price_unit,
        input.active,
        input.sort_order,
      ],
    );
    return { status: 201, body: { service: serialize(await loadService(id)) } };
  });

  router.put("/api/admin/services/:id", async (context) => {
    requireRole(context, "admin");
    const existing = await loadService(context.params.id);
    const input = readServiceInput(context.body, existing);
    await database.execute(
      `UPDATE services SET name = ?, description = ?, image = ?, icon = ?, category = ?,
       price = ?, price_unit = ?, active = ?, sort_order = ? WHERE id = ?`,
      [
        input.name,
        input.description,
        input.image,
        input.icon,
        input.category,
        input.price,
        input.price_unit,
        input.active,
        input.sort_order,
        existing.id,
      ],
    );
    return { body: { service: serialize(await loadService(existing.id)) } };
  });

  router.delete("/api/admin/services/:id", async (context) => {
    requireRole(context, "admin");
    const service = await loadService(context.params.id);
    const [[{ count }]] = await database.execute(
      "SELECT COUNT(*) AS count FROM booking_items WHERE service_id = ?",
      [service.id],
    );
    // Deleting would blank the service on historical orders (ON DELETE SET NULL),
    // so keep the row and let the admin disable it instead.
    if (count) {
      throw conflict(
        `"${service.name}" is used by ${count} booking${count === 1 ? "" : "s"}. Deactivate it instead of deleting.`,
      );
    }
    await database.execute("DELETE FROM services WHERE id = ?", [service.id]);
    return { body: { message: "Service deleted." } };
  });
}
