// Creates and migrates the MySQL schema on boot so a fresh clone only needs a
// database and credentials. server/schema.sql is the same structure as a single
// script for DBAs who prefer to provision it by hand.

import { database, newId } from "./db.js";
import { config } from "./env.js";
import { hashPassword } from "./passwords.js";

const BOOKING_STATUSES = [
  "Booking Requested",
  "Booking Confirmed",
  "Service Boy Assigned",
  "Clothes Picked Up",
  "Cleaning in Progress",
  "Ready for Delivery",
  "Delivered",
  "Cancelled",
];

const STATUS_ENUM = BOOKING_STATUSES.map((status) => `'${status}'`).join(",");

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(32) NOT NULL,
    email VARCHAR(254) NOT NULL,
    full_name VARCHAR(120) NULL,
    role ENUM('customer','admin','service_boy') NOT NULL DEFAULT 'customer',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    address TEXT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    reset_token_hash CHAR(64) NULL,
    reset_token_expires DATETIME NULL,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY users_email_unique (email),
    KEY users_role_index (role, active),
    KEY users_reset_token_index (reset_token_hash)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS services (
    id CHAR(32) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    image VARCHAR(1024) NULL,
    icon VARCHAR(64) NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'General',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_unit VARCHAR(32) NOT NULL DEFAULT 'per item',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY services_active_sort_index (active, sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS coupons (
    id CHAR(32) NOT NULL,
    code VARCHAR(48) NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT '',
    discount_type ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_uses INT NOT NULL DEFAULT 0,
    per_user_limit INT NOT NULL DEFAULT 0,
    used_count INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from DATE NULL,
    valid_until DATE NULL,
    created_by CHAR(32) NULL,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY coupons_code_unique (code),
    KEY coupons_active_index (active, valid_from, valid_until),
    CONSTRAINT coupons_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS bookings (
    id CHAR(32) NOT NULL,
    booking_id VARCHAR(32) NOT NULL,
    customer_id CHAR(32) NOT NULL,
    customer_name VARCHAR(120) NULL,
    customer_phone VARCHAR(32) NOT NULL DEFAULT '',
    number_of_items INT NOT NULL DEFAULT 1,
    special_instructions TEXT NULL,
    pickup_address TEXT NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time VARCHAR(64) NOT NULL,
    status ENUM(${STATUS_ENUM}) NOT NULL DEFAULT 'Booking Requested',
    service_boy_id CHAR(32) NULL,
    service_boy_name VARCHAR(120) NULL,
    service_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    additional_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    coupon_id CHAR(32) NULL,
    coupon_code VARCHAR(48) NULL,
    coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_set BOOLEAN NOT NULL DEFAULT FALSE,
    delivered_date DATETIME(3) NULL,
    cancelled_date DATETIME(3) NULL,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY bookings_reference_unique (booking_id),
    KEY bookings_customer_index (customer_id, created_date),
    KEY bookings_service_boy_index (service_boy_id, pickup_date),
    KEY bookings_status_index (status),
    KEY bookings_pickup_date_index (pickup_date),
    CONSTRAINT bookings_customer_fk FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT bookings_service_boy_fk FOREIGN KEY (service_boy_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT bookings_coupon_fk FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS booking_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id CHAR(32) NOT NULL,
    service_id CHAR(32) NULL,
    service_name VARCHAR(120) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_unit VARCHAR(32) NOT NULL DEFAULT 'per item',
    line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY booking_items_booking_index (booking_id),
    CONSTRAINT booking_items_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT booking_items_service_fk FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS booking_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id CHAR(32) NOT NULL,
    status VARCHAR(64) NOT NULL,
    changed_by CHAR(32) NULL,
    note VARCHAR(255) NULL,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY booking_status_history_booking_index (booking_id, created_date),
    CONSTRAINT booking_status_history_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT booking_status_history_user_fk FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    coupon_id CHAR(32) NOT NULL,
    booking_id CHAR(32) NOT NULL,
    user_id CHAR(32) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY coupon_redemptions_booking_unique (booking_id),
    KEY coupon_redemptions_coupon_user_index (coupon_id, user_id),
    CONSTRAINT coupon_redemptions_coupon_fk FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE CASCADE,
    CONSTRAINT coupon_redemptions_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT coupon_redemptions_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id CHAR(32) NOT NULL,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'Other',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT NULL,
    created_by CHAR(32) NULL,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY expenses_date_index (date),
    KEY expenses_category_index (category),
    CONSTRAINT expenses_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS contact_messages (
    id CHAR(32) NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(32) NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    handled BOOLEAN NOT NULL DEFAULT FALSE,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY contact_messages_handled_index (handled, created_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(64) NOT NULL,
    setting_value TEXT NOT NULL,
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (setting_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

// Columns added after the first release. Each entry is applied only when the
// column is missing, so repeated boots are a no-op.
const ADDED_COLUMNS = [
  ["users", "active", "BOOLEAN NOT NULL DEFAULT TRUE"],
  ["users", "must_change_password", "BOOLEAN NOT NULL DEFAULT FALSE"],
  ["users", "reset_token_hash", "CHAR(64) NULL"],
  ["users", "reset_token_expires", "DATETIME NULL"],
  ["services", "image", "VARCHAR(1024) NULL"],
  ["services", "icon", "VARCHAR(64) NULL"],
  ["bookings", "service_boy_id", "CHAR(32) NULL"],
  ["bookings", "service_boy_name", "VARCHAR(120) NULL"],
  ["bookings", "coupon_id", "CHAR(32) NULL"],
  ["bookings", "coupon_code", "VARCHAR(48) NULL"],
  ["bookings", "coupon_discount", "DECIMAL(10,2) NOT NULL DEFAULT 0"],
  ["bookings", "delivered_date", "DATETIME(3) NULL"],
  ["bookings", "cancelled_date", "DATETIME(3) NULL"],
];

const STARTER_SERVICES = [
  ["Wash & Fold", "Everyday wash, dry, and neatly folded garments.", "Wash", 45, "per kg", 1],
  ["Wash & Iron", "Cleaned and pressed for a crisp finish.", "General", 65, "per kg", 2],
  ["Dry Cleaning", "Professional care for delicate garments.", "Dry Cleaning", 180, "per item", 3],
  ["Saree Care", "Gentle cleaning for silk and special sarees.", "Saree", 250, "per item", 4],
  ["Ironing", "Steam-pressed and ready to wear.", "Iron", 15, "per item", 5],
  ["Blanket & Quilt", "Deep cleaning for bulky home linens.", "Home Care", 350, "per item", 6],
];

export const DEFAULT_SETTINGS = {
  business_name: "STAR LAUNDROVAMAT",
  business_tagline: "Premium Garment Stewardship",
  contact_phone: "+91 99999 99999",
  contact_email: "care@starlaundrovamat.com",
  service_area: "Available across the city",
  business_hours: "Mon-Sun, 8am-8pm",
  currency: "INR",
  currency_symbol: "₹",
};

async function hasColumn(table, column) {
  const [rows] = await database.query("SHOW COLUMNS FROM ?? LIKE ?", [table, column]);
  return rows.length > 0;
}

async function tableExists(table) {
  const [rows] = await database.query("SHOW TABLES LIKE ?", [table]);
  return rows.length > 0;
}

/**
 * The first release stored booking line items in a `services` JSON column.
 * Move them into booking_items, then drop the column.
 */
async function migrateBookingServicesJson() {
  if (!(await tableExists("bookings"))) return;
  if (!(await hasColumn("bookings", "services"))) return;

  const [bookings] = await database.query("SELECT id, services FROM bookings");
  for (const booking of bookings) {
    const [existing] = await database.execute(
      "SELECT COUNT(*) AS count FROM booking_items WHERE booking_id = ?",
      [booking.id],
    );
    if (existing[0].count) continue;

    let items = booking.services;
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }
    for (const item of Array.isArray(items) ? items : []) {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      await database.execute(
        `INSERT INTO booking_items (booking_id, service_id, service_name, quantity, price, price_unit, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.id,
          item.service_id || null,
          item.service_name || "Service",
          quantity,
          price,
          item.price_unit || "per item",
          price * quantity,
        ],
      );
    }
  }
  await database.query("ALTER TABLE bookings DROP COLUMN services");
}

/** Widens the legacy VARCHAR `role` column to the role ENUM. */
async function migrateUserRoleColumn() {
  const [columns] = await database.query("SHOW COLUMNS FROM users LIKE 'role'");
  if (!columns.length || columns[0].Type.startsWith("enum")) return;
  await database.query(
    "UPDATE users SET role = 'customer' WHERE role NOT IN ('customer','admin','service_boy')",
  );
  await database.query(
    "ALTER TABLE users MODIFY COLUMN role ENUM('customer','admin','service_boy') NOT NULL DEFAULT 'customer'",
  );
}

async function seedServices() {
  const [[{ count }]] = await database.query("SELECT COUNT(*) AS count FROM services");
  if (count) return;
  for (const [name, description, category, price, priceUnit, sortOrder] of STARTER_SERVICES) {
    await database.execute(
      `INSERT INTO services (id, name, description, category, price, price_unit, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId(), name, description, category, price, priceUnit, sortOrder],
    );
  }
}

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await database.execute(
      "INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES (?, ?)",
      [key, value],
    );
  }
}

/**
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when no admin
 * exists yet. Without this there is no way to reach the admin panel on a fresh
 * database, since signup always produces a customer.
 */
async function seedAdmin() {
  const [[{ count }]] = await database.query(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'",
  );
  if (count) return;
  if (!config.adminEmail || !config.adminPassword) {
    console.warn(
      "[api] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env and restart to create one.",
    );
    return;
  }
  if (config.adminPassword.length < 8) {
    console.warn("[api] ADMIN_PASSWORD must be at least 8 characters. Skipping admin seed.");
    return;
  }

  // An existing customer with that address is promoted rather than duplicated.
  const [existing] = await database.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [
    config.adminEmail,
  ]);
  if (existing.length) {
    await database.execute("UPDATE users SET role = 'admin', active = TRUE WHERE id = ?", [
      existing[0].id,
    ]);
    console.log(`[api] Promoted ${config.adminEmail} to admin.`);
    return;
  }

  await database.execute(
    `INSERT INTO users (id, email, full_name, role, phone, address, password_hash)
     VALUES (?, ?, ?, 'admin', '', '', ?)`,
    [newId(), config.adminEmail, "Administrator", await hashPassword(config.adminPassword)],
  );
  console.log(`[api] Created admin account ${config.adminEmail}.`);
}

export async function initializeDatabase() {
  for (const statement of TABLES) await database.query(statement);
  for (const [table, column, definition] of ADDED_COLUMNS) {
    if (!(await hasColumn(table, column))) {
      await database.query(`ALTER TABLE ?? ADD COLUMN ?? ${definition}`, [table, column]);
    }
  }
  await migrateUserRoleColumn();
  await migrateBookingServicesJson();
  await seedServices();
  await seedSettings();
  await seedAdmin();
}

export { BOOKING_STATUSES };
