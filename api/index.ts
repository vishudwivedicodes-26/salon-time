import express, { type Application } from "express";
import cors from "cors";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { eq, and } from "drizzle-orm";
import * as zod from "zod";

const { Pool } = pg;

// --- Database Schema ---
export const salonsTable = pgTable("salons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("20:00"),
  pin: text("pin").notNull().default("0000"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull().references(() => salonsTable.id),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull().references(() => salonsTable.id),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const schema = { salonsTable, servicesTable, bookingsTable };

// --- Validation Schemas ---
export const CreateSalonBody = zod.object({
  name: zod.string(),
  ownerName: zod.string(),
  phone: zod.string(),
  address: zod.string(),
  openTime: zod.string(),
  closeTime: zod.string(),
  pin: zod.string().describe("4-digit PIN for owner dashboard access"),
});

export const SalonLoginBody = zod.object({
  salonId: zod.number(),
  pin: zod.string(),
});

export const GetSalonParams = zod.object({
  salonId: zod.coerce.number(),
});

export const GetSalonServicesParams = zod.object({
  salonId: zod.coerce.number(),
});

export const CreateServiceParams = zod.object({
  salonId: zod.coerce.number(),
});

export const CreateServiceBody = zod.object({
  name: zod.string(),
  description: zod.string().nullish(),
  durationMinutes: zod.number(),
  price: zod.number(),
});

export const GetAvailableSlotsParams = zod.object({
  salonId: zod.coerce.number(),
});

export const GetAvailableSlotsQueryParams = zod.object({
  date: zod.coerce.string(),
  serviceId: zod.coerce.number().optional(),
});

export const GetBookingsQueryParams = zod.object({
  salonId: zod.coerce.number().optional(),
  date: zod.coerce.string().optional(),
});

export const CreateBookingBody = zod.object({
  salonId: zod.number(),
  serviceId: zod.number(),
  clientName: zod.string(),
  clientPhone: zod.string(),
  date: zod.string(),
  time: zod.string(),
  notes: zod.string().nullish(),
});

export const GetBookingParams = zod.object({
  bookingId: zod.coerce.number(),
});

export const UpdateBookingStatusParams = zod.object({
  bookingId: zod.coerce.number(),
});

export const UpdateBookingStatusBody = zod.object({
  status: zod.string(),
});

// --- Database Connection ---
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase in some environments
});
const db = drizzle(pool, { schema });

// --- Express App ---
const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helpers
function stripPin(salon: any) {
  const { pin, ...rest } = salon;
  return rest;
}

function formatSalon(salon: any) {
  return stripPin({ ...salon, createdAt: salon.createdAt.toISOString() });
}

// Routes
app.get("/api/healthz", async (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

app.get("/api/salons", async (_req, res) => {
  const salons = await db.select().from(salonsTable);
  res.json(salons.map(s => formatSalon(s)));
});

app.post("/api/salons", async (req, res) => {
  const input = CreateSalonBody.parse(req.body);
  const [salon] = await db.insert(salonsTable).values(input).returning();
  res.status(201).json(formatSalon(salon));
});

app.post("/api/salons/login", async (req, res) => {
  const { salonId, pin } = SalonLoginBody.parse(req.body);
  const [salon] = await db.select().from(salonsTable).where(eq(salonsTable.id, salonId));
  if (!salon) {
    return res.status(404).json({ error: "Salon not found" });
  }
  if (salon.pin !== pin) {
    return res.status(401).json({ error: "Galat PIN hai. Dobara try karein." });
  }
  res.json(formatSalon(salon));
});

app.get("/api/salons/:salonId", async (req, res) => {
  const { salonId } = GetSalonParams.parse({ salonId: Number(req.params.salonId) });
  const [salon] = await db.select().from(salonsTable).where(eq(salonsTable.id, salonId));
  if (!salon) {
    return res.status(404).json({ error: "Salon not found" });
  }
  res.json(formatSalon(salon));
});

app.get("/api/salons/:salonId/services", async (req, res) => {
  const { salonId } = GetSalonServicesParams.parse({ salonId: Number(req.params.salonId) });
  const services = await db.select().from(servicesTable).where(eq(servicesTable.salonId, salonId));
  res.json(services.map(s => ({
    ...s,
    price: Number(s.price),
    createdAt: s.createdAt.toISOString(),
  })));
});

app.post("/api/salons/:salonId/services", async (req, res) => {
  const { salonId } = CreateServiceParams.parse({ salonId: Number(req.params.salonId) });
  const input = CreateServiceBody.parse(req.body);
  const [service] = await db.insert(servicesTable).values({
    ...input,
    salonId,
    price: String(input.price),
  }).returning();
  res.status(201).json({
    ...service,
    price: Number(service.price),
    createdAt: service.createdAt.toISOString(),
  });
});

app.get("/api/salons/:salonId/slots", async (req, res) => {
  const { salonId } = GetAvailableSlotsParams.parse({ salonId: Number(req.params.salonId) });
  const query = GetAvailableSlotsQueryParams.parse({
    date: req.query.date,
    serviceId: req.query.serviceId ? Number(req.query.serviceId) : undefined,
  });

  const [salon] = await db.select().from(salonsTable).where(eq(salonsTable.id, salonId));
  if (!salon) {
    return res.status(404).json({ error: "Salon not found" });
  }

  let durationMinutes = 30;
  if (query.serviceId) {
    const [service] = await db.select().from(servicesTable).where(
      and(eq(servicesTable.id, query.serviceId), eq(servicesTable.salonId, salonId))
    );
    if (service) durationMinutes = service.durationMinutes;
  }

  const existingBookings = await db.select().from(bookingsTable).where(
    and(eq(bookingsTable.salonId, salonId), eq(bookingsTable.date, query.date))
  );
  const bookedTimes = new Set(existingBookings.filter(b => b.status !== "cancelled").map(b => b.time));

  const slots = [];
  const [openH, openM] = salon.openTime.split(":").map(Number);
  const [closeH, closeM] = salon.closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += durationMinutes) {
    const hour = Math.floor(m / 60);
    const min = m % 60;
    const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    slots.push({ time, available: !bookedTimes.has(time) });
  }
  res.json(slots);
});

app.get("/api/bookings", async (req, res) => {
  const query = GetBookingsQueryParams.parse({
    salonId: req.query.salonId ? Number(req.query.salonId) : undefined,
    date: req.query.date as string | undefined,
  });

  let rows = await db.select({
    booking: bookingsTable,
    service: servicesTable,
  })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id));

  if (query.salonId) {
    rows = rows.filter(r => r.booking.salonId === query.salonId);
  }
  if (query.date) {
    rows = rows.filter(r => r.booking.date === query.date);
  }

  res.json(rows.map(r => ({
    ...r.booking,
    serviceName: r.service.name,
    createdAt: r.booking.createdAt.toISOString(),
  })));
});

app.post("/api/bookings", async (req, res) => {
  const input = CreateBookingBody.parse(req.body);

  const conflict = await db.select().from(bookingsTable).where(
    and(
      eq(bookingsTable.salonId, input.salonId),
      eq(bookingsTable.date, input.date),
      eq(bookingsTable.time, input.time),
    )
  );

  const active = conflict.filter(b => b.status !== "cancelled");
  if (active.length > 0) {
    return res.status(400).json({ error: "This time slot is already booked." });
  }

  const [booking] = await db.insert(bookingsTable).values({
    ...input,
    status: "pending",
  }).returning();

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, booking.serviceId));

  res.status(201).json({
    ...booking,
    serviceName: service?.name ?? "",
    createdAt: booking.createdAt.toISOString(),
  });
});

app.get("/api/bookings/:bookingId", async (req, res) => {
  const { bookingId } = GetBookingParams.parse({ bookingId: Number(req.params.bookingId) });
  const rows = await db.select({
    booking: bookingsTable,
    service: servicesTable,
  })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(eq(bookingsTable.id, bookingId));

  if (rows.length === 0) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const { booking, service } = rows[0];
  res.json({
    ...booking,
    serviceName: service.name,
    createdAt: booking.createdAt.toISOString(),
  });
});

app.patch("/api/bookings/:bookingId", async (req, res) => {
  const { bookingId } = UpdateBookingStatusParams.parse({ bookingId: Number(req.params.bookingId) });
  const { status } = UpdateBookingStatusBody.parse(req.body);

  const [booking] = await db
    .update(bookingsTable)
    .set({ status })
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, booking.serviceId));

  res.json({
    ...booking,
    serviceName: service?.name ?? "",
    createdAt: booking.createdAt.toISOString(),
  });
});

// Startup Seed
(async () => {
    try {
        const existing = await db.select().from(salonsTable).limit(1);
        if (existing.length === 0) {
            await db.insert(salonsTable).values({
                name: "Test Salon",
                ownerName: "Test Owner",
                address: "123 Main St",
                phone: "1234567890",
                openTime: "09:00",
                closeTime: "20:00",
                pin: "1234",
            });
            console.log("Database seeded with test salon.");
        }
    } catch (e) {
        console.error("Seed failed:", e);
    }
})();

export default app;
