import mysql from "mysql2/promise";
import { randomBytes } from "node:crypto";
import { config } from "./env.js";

export const database = mysql.createPool({
  ...config.mysql,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // DECIMAL columns arrive as strings by default, which silently turns every
  // money arithmetic in the app into string concatenation.
  decimalNumbers: true,
  dateStrings: ["DATE"],
});

/** Primary keys are 32-char hex so ids stay URL-safe and opaque. */
export const newId = () => randomBytes(16).toString("hex");

/** Runs `handler` inside a transaction, rolling back on any thrown error. */
export async function transaction(handler) {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
