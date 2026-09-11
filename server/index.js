import { createHash, createHmac, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const port = Number(process.env.PORT || 3001);
const secret = process.env.AUTH_JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "local-development-secret-change-me");
const requiredDbSettings = ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER"];

if (!secret) throw new Error("AUTH_JWT_SECRET must be set in production.");
for (const setting of requiredDbSettings) if (!process.env[setting]) throw new Error(`${setting} must be set before starting the API.`);
if (process.env.NODE_ENV === "production" && !process.env.MYSQL_PASSWORD) throw new Error("MYSQL_PASSWORD must be set in production.");

const database = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  // XAMPP/phpMyAdmin local installs commonly use a blank password. Production
  // is guarded above and must always supply a password.
  password: process.env.MYSQL_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
const sign = (value) => createHmac("sha256", secret).update(value).digest("base64url");
const publicUser = ({ password_hash, ...user }) => user;

async function initializeDatabase() {
  await database.execute(`CREATE TABLE IF NOT EXISTS users (
    id CHAR(32) PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    full_name VARCHAR(120) NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'customer',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    address TEXT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX users_role_index (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [resetHashColumn] = await database.query("SHOW COLUMNS FROM users LIKE 'reset_token_hash'");
  if (!resetHashColumn.length) await database.query("ALTER TABLE users ADD COLUMN reset_token_hash CHAR(64) NULL");
  const [resetExpiryColumn] = await database.query("SHOW COLUMNS FROM users LIKE 'reset_token_expires'");
  if (!resetExpiryColumn.length) await database.query("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL");
  await database.query(`CREATE TABLE IF NOT EXISTS services (
    id CHAR(32) PRIMARY KEY, name VARCHAR(120) NOT NULL, description TEXT NULL,
    category VARCHAR(64) NOT NULL, price DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_unit VARCHAR(32) NOT NULL DEFAULT 'per item', active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0, created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX services_active_sort_index (active, sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await database.query(`CREATE TABLE IF NOT EXISTS bookings (
    id CHAR(32) PRIMARY KEY, booking_id VARCHAR(32) NOT NULL UNIQUE, customer_id CHAR(32) NOT NULL,
    services JSON NOT NULL, number_of_items INT NOT NULL, special_instructions TEXT NULL,
    pickup_address TEXT NOT NULL, pickup_date DATE NOT NULL, pickup_time VARCHAR(64) NOT NULL,
    customer_name VARCHAR(120) NULL, customer_phone VARCHAR(32) NOT NULL DEFAULT '',
    status VARCHAR(64) NOT NULL DEFAULT 'Booking Requested', service_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    additional_charges DECIMAL(10,2) NOT NULL DEFAULT 0, discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0, amount_set BOOLEAN NOT NULL DEFAULT FALSE,
    created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT bookings_customer_fk FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX bookings_customer_date_index (customer_id, created_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [serviceCount] = await database.query("SELECT COUNT(*) AS count FROM services");
  if (!serviceCount[0].count) {
    const starterServices = [
      ["Wash & Fold", "Everyday wash, dry, and neatly folded garments.", "Wash", 45, "per kg", 1],
      ["Wash & Iron", "Cleaned and pressed for a crisp finish.", "General", 65, "per kg", 2],
      ["Dry Cleaning", "Professional care for delicate garments.", "Dry Cleaning", 180, "per item", 3],
      ["Saree Care", "Gentle cleaning for silk and special sarees.", "Saree", 250, "per item", 4],
      ["Ironing", "Steam-pressed and ready to wear.", "Iron", 15, "per item", 5],
      ["Blanket & Quilt", "Deep cleaning for bulky home linens.", "Home Care", 350, "per item", 6],
    ];
    for (const [name, description, category, price, priceUnit, sortOrder] of starterServices) {
      await database.execute("INSERT INTO services (id, name, description, category, price, price_unit, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", [randomBytes(16).toString("hex"), name, description, category, price, priceUnit, sortOrder]);
    }
  }
}

function mailer() {
  const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  if (required.some((key) => !process.env[key])) throw new Error("Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in .env.");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString("base64url")}`;
}

async function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = Buffer.from(await scrypt(password, salt, 64)).toString("base64url");
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function issueToken(user) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 });
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

async function userFromRequest(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature || signature !== sign(`${header}.${payload}`)) return null;
  try {
    const claims = decode(payload);
    if (claims.exp * 1000 < Date.now()) return null;
    const [users] = await database.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [claims.sub]);
    return users[0] || null;
  } catch { return null; }
}

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN || "http://localhost:5173", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS" });
  response.end(JSON.stringify(body));
}

async function bodyOf(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  try { return body ? JSON.parse(body) : {}; }
  catch { throw new Error("Request body must be valid JSON."); }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/services") {
      const [services] = await database.execute("SELECT * FROM services WHERE active = TRUE ORDER BY sort_order ASC, name ASC");
      return send(response, 200, { services });
    }

    if (request.method === "POST" && url.pathname === "/api/auth/signup") {
      const { email = "", password = "", fullName = "" } = await bodyOf(request);
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return send(response, 400, { message: "Enter a valid email address." });
      if (password.length < 8) return send(response, 400, { message: "Password must be at least 8 characters." });
      const [existing] = await database.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
      if (existing.length) return send(response, 409, { message: "An account with this email already exists." });
      const user = { id: randomBytes(16).toString("hex"), email: normalizedEmail, full_name: fullName.trim() || null, role: "customer", phone: "", address: "", password_hash: await hashPassword(password) };
      await database.execute("INSERT INTO users (id, email, full_name, role, phone, address, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)", [user.id, user.email, user.full_name, user.role, user.phone, user.address, user.password_hash]);
      return send(response, 201, { access_token: issueToken(user), user: publicUser(user) });
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const { email = "", password = "" } = await bodyOf(request);
      const [users] = await database.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [email.trim().toLowerCase()]);
      const user = users[0];
      if (!user || !(await verifyPassword(password, user.password_hash))) return send(response, 401, { message: "Invalid email or password." });
      return send(response, 200, { access_token: issueToken(user), user: publicUser(user) });
    }

    if (request.method === "POST" && url.pathname === "/api/auth/forgot-password") {
      const { email = "" } = await bodyOf(request);
      const [users] = await database.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [email.trim().toLowerCase()]);
      const account = users[0];
      if (account) {
        const otp = String(randomInt(100000, 1000000));
        const tokenHash = createHash("sha256").update(otp).digest("hex");
        await database.execute("UPDATE users SET reset_token_hash = ?, reset_token_expires = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE) WHERE id = ?", [tokenHash, account.id]);
        await mailer().sendMail({
          from: process.env.SMTP_FROM,
          to: account.email,
          subject: "Your Star Laundrovamat password reset code",
          text: `Your password reset code is ${otp}. It expires in 30 minutes. Do not share this code.`,
          html: `<p>Your Star Laundrovamat password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p><p>This code expires in 30 minutes. Do not share it.</p>`,
        });
      }
      return send(response, 200, { message: "If an account exists with that email, a reset link has been sent." });
    }

    if (request.method === "POST" && url.pathname === "/api/auth/reset-password") {
      const { email = "", otp = "", newPassword = "" } = await bodyOf(request);
      if (newPassword.length < 8) return send(response, 400, { message: "Password must be at least 8 characters." });
      if (!/^\d{6}$/.test(otp)) return send(response, 400, { message: "Enter the six-digit code from your email." });
      const tokenHash = createHash("sha256").update(otp).digest("hex");
      const [users] = await database.execute("SELECT * FROM users WHERE email = ? AND reset_token_hash = ? AND reset_token_expires > UTC_TIMESTAMP() LIMIT 1", [email.trim().toLowerCase(), tokenHash]);
      const account = users[0];
      if (!account) return send(response, 400, { message: "This reset link is invalid or has expired." });
      await database.execute("UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?", [await hashPassword(newPassword), account.id]);
      return send(response, 200, { message: "Password reset successfully. You can now log in." });
    }

    const user = await userFromRequest(request);
    if (!user) return send(response, 401, { message: "Authentication required." });
    if (request.method === "POST" && url.pathname === "/api/bookings") {
      const body = await bodyOf(request);
      const requestedServices = Array.isArray(body.services) ? body.services : [];
      if (!requestedServices.length) return send(response, 400, { message: "Choose at least one laundry service." });
      if (!body.pickup_address?.trim() || !body.pickup_date || !body.pickup_time?.trim()) return send(response, 400, { message: "Pickup address, date, and time are required." });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.pickup_date) || new Date(`${body.pickup_date}T00:00:00`) < new Date(new Date().toDateString())) return send(response, 400, { message: "Choose a valid future pickup date." });
      const ids = [...new Set(requestedServices.map((item) => item.service_id).filter(Boolean))];
      if (!ids.length) return send(response, 400, { message: "Choose valid laundry services." });
      const placeholders = ids.map(() => "?").join(",");
      const [availableServices] = await database.query(`SELECT * FROM services WHERE active = TRUE AND id IN (${placeholders})`, ids);
      if (availableServices.length !== ids.length) return send(response, 400, { message: "One or more selected services are unavailable." });
      const serviceMap = new Map(availableServices.map((service) => [service.id, service]));
      const services = requestedServices.map((item) => {
        const service = serviceMap.get(item.service_id);
        const quantity = Math.max(1, Math.min(999, Number.parseInt(item.quantity, 10) || 1));
        return { service_id: service.id, service_name: service.name, quantity, price: Number(service.price), price_unit: service.price_unit };
      });
      const numberOfItems = Math.max(1, Math.min(999, Number.parseInt(body.number_of_items, 10) || services.reduce((sum, item) => sum + item.quantity, 0)));
      const servicePrice = services.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const booking = { id: randomBytes(16).toString("hex"), booking_id: `LND-${Date.now().toString().slice(-8)}-${randomInt(100, 1000)}`, customer_id: user.id, services, number_of_items: numberOfItems, special_instructions: body.special_instructions?.trim() || null, pickup_address: body.pickup_address.trim(), pickup_date: body.pickup_date, pickup_time: body.pickup_time.trim(), customer_name: user.full_name, customer_phone: body.phone?.trim() || user.phone || "", status: "Booking Requested", service_price: servicePrice, final_amount: servicePrice };
      await database.execute("INSERT INTO bookings (id, booking_id, customer_id, services, number_of_items, special_instructions, pickup_address, pickup_date, pickup_time, customer_name, customer_phone, status, service_price, final_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [booking.id, booking.booking_id, booking.customer_id, JSON.stringify(booking.services), booking.number_of_items, booking.special_instructions, booking.pickup_address, booking.pickup_date, booking.pickup_time, booking.customer_name, booking.customer_phone, booking.status, booking.service_price, booking.final_amount]);
      return send(response, 201, { booking });
    }
    if (request.method === "GET" && url.pathname === "/api/bookings") {
      const [bookings] = await database.execute("SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_date DESC", [user.id]);
      return send(response, 200, { bookings: bookings.map((booking) => ({ ...booking, services: typeof booking.services === "string" ? JSON.parse(booking.services) : booking.services })) });
    }
    const bookingMatch = url.pathname.match(/^\/api\/bookings\/([a-f0-9]{32})$/);
    if (request.method === "GET" && bookingMatch) {
      const [bookings] = await database.execute("SELECT * FROM bookings WHERE id = ? AND customer_id = ? LIMIT 1", [bookingMatch[1], user.id]);
      if (!bookings[0]) return send(response, 404, { message: "Booking not found." });
      const booking = bookings[0];
      return send(response, 200, { booking: { ...booking, services: typeof booking.services === "string" ? JSON.parse(booking.services) : booking.services } });
    }
    if (request.method === "GET" && url.pathname === "/api/auth/me") return send(response, 200, { user: publicUser(user) });
    if (request.method === "PUT" && url.pathname === "/api/auth/me") {
      const body = await bodyOf(request);
      const fullName = typeof body.full_name === "string" ? body.full_name.trim() || null : user.full_name;
      const phone = typeof body.phone === "string" ? body.phone.trim() : user.phone;
      const address = typeof body.address === "string" ? body.address.trim() : user.address;
      if (fullName && fullName.length > 120) return send(response, 400, { message: "Full name must be 120 characters or fewer." });
      if (phone.length > 32) return send(response, 400, { message: "Phone number must be 32 characters or fewer." });
      await database.execute("UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?", [fullName, phone, address, user.id]);
      const [updated] = await database.execute("SELECT * FROM users WHERE id = ?", [user.id]);
      return send(response, 200, { user: publicUser(updated[0]) });
    }
    return send(response, 404, { message: "API route not found." });
  } catch (error) {
    console.error(error);
    return send(response, 500, { message: error.code === "ER_DUP_ENTRY" ? "An account with this email already exists." : "Internal server error." });
  }
});

await initializeDatabase();
server.listen(port, () => console.log(`Laundry API listening on http://localhost:${port}`));
