import pg from "pg";
const { Client } = pg;

const DATABASE_URL = "postgresql://postgres:SalonTime38yu@db.qvbkmfdrbaypsuedafoj.supabase.co:5432/postgres";

const sql = `
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
`;

async function setup() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log("Connected to Supabase.");
        await client.query(sql);
        console.log("Tables created successfully!");
    } catch (err) {
        console.error("Setup failed:", err);
    } finally {
        await client.end();
    }
}

setup();
