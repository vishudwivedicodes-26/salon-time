import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../lib/db/index";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment.");
  process.exit(1);
}

console.log("Starting Database Initialization...");
console.log("Target DB:", connectionString.replace(/:[^:@]+@/, ":****@"));

const pool = new pg.Pool({
  host: "3.111.105.85", // Force IPv4 explicitly
  port: 6543,
  user: "postgres.qvbkmfdrbaypsuedafoj",
  password: "SalonTime38yu",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const db = drizzle(pool, { schema });

async function init() {
  try {
    console.log("Verifying connection to 3.111.105.85:6543...");
    const client = await pool.connect();
    console.log("Client connected!");
    await client.query("SELECT NOW()");
    client.release();
    console.log("Connection successful.");

    console.log("Synchronizing schema...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "salons" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "owner_name" text NOT NULL,
          "phone" text NOT NULL,
          "address" text NOT NULL,
          "open_time" text DEFAULT '09:00' NOT NULL,
          "close_time" text DEFAULT '20:00' NOT NULL,
          "pin" text DEFAULT '0000' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "services" (
          "id" serial PRIMARY KEY NOT NULL,
          "salon_id" integer NOT NULL REFERENCES "salons"("id"),
          "name" text NOT NULL,
          "description" text,
          "duration_minutes" integer DEFAULT 30 NOT NULL,
          "price" numeric(10, 2) NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "bookings" (
          "id" serial PRIMARY KEY NOT NULL,
          "salon_id" integer NOT NULL REFERENCES "salons"("id"),
          "service_id" integer NOT NULL REFERENCES "services"("id"),
          "client_name" text NOT NULL,
          "client_phone" text NOT NULL,
          "date" text NOT NULL,
          "time" text NOT NULL,
          "status" text DEFAULT 'pending' NOT NULL,
          "notes" text,
          "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Schema synchronized (tables verified/created).");

    const existing = await db.select().from(schema.salonsTable).limit(1);
    if (existing.length === 0) {
      console.log("Seeding default data...");
      await db.insert(schema.salonsTable).values({
        name: "Aura Salon",
        ownerName: "Vishu Dwivedi",
        address: "Lucknow, India",
        phone: "9876543210",
        openTime: "09:00",
        closeTime: "20:00",
        pin: "1234",
      });
      console.log("Database seeded with Aura Salon.");
    } else {
      console.log("Database already contains data, skipping seed.");
    }

    console.log("Initialization complete!");
  } catch (error: any) {
    console.error("Initialization failed!");
    console.error("Error message:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
