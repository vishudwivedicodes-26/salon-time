import express, { type Application } from "express";
import cors from "cors";
import * as zod from "zod";
import { createClient } from "@supabase/supabase-js";

// --- Env Configuration ---
// --- Env Configuration ---
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn("CRITICAL: SUPABASE_URL or SUPABASE_ANON_KEY is missing. API will fail.");
}

const supabase = createClient(
  supabaseUrl || "https://missing-url.supabase.co",
  supabaseKey || "missing-key"
);

// --- Validation Schemas ---
export const CreateSalonBody = zod.object({
  name: zod.string(),
  ownerName: zod.string(),
  phone: zod.string(),
  address: zod.string(),
  openTime: zod.string(),
  closeTime: zod.string(),
  pin: zod.string(),
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

// --- Express App ---
const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helpers
function stripPin(salon: any) {
  if (!salon) return null;
  const { pin, ...rest } = salon;
  return rest;
}

function formatSalon(salon: any) {
  if (!salon) return null;
  // Supabase uses snake_case in DB, map it back to camelCase for frontend
  return stripPin({
    id: salon.id,
    name: salon.name,
    ownerName: salon.owner_name,
    phone: salon.phone,
    address: salon.address,
    openTime: salon.open_time,
    closeTime: salon.close_time,
    pin: salon.pin,
    createdAt: salon.created_at,
  });
}

// Routes
app.get("/api/healthz", async (req, res) => {
  res.json({ 
    status: "ok", 
    database: "supabase-sdk",
    diagnostics: {
      hasUrl: !!process.env.SUPABASE_URL,
      urlLength: process.env.SUPABASE_URL?.length || 0,
      hasKey: !!process.env.SUPABASE_ANON_KEY,
      keyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

app.get("/api/salons", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("salons").select("*");
    if (error) throw error;
    res.json((data || []).map(s => formatSalon(s)));
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.post("/api/salons", async (req, res) => {
  try {
    const input = CreateSalonBody.parse(req.body);
    const { data, error } = await supabase
      .from("salons")
      .insert({
        name: input.name,
        owner_name: input.ownerName,
        phone: input.phone,
        address: input.address,
        open_time: input.openTime,
        close_time: input.closeTime,
        pin: input.pin,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(formatSalon(data));
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.post("/api/salons/login", async (req, res) => {
  try {
    const { salonId, pin } = SalonLoginBody.parse(req.body);
    const { data: salon, error } = await supabase
      .from("salons")
      .select("*")
      .eq("id", salonId)
      .single();

    if (error || !salon) {
      return res.status(404).json({ error: "Salon not found" });
    }
    if (salon.pin !== pin) {
      return res.status(401).json({ error: "Galat PIN hai. Dobara try karein." });
    }
    res.json(formatSalon(salon));
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.get("/api/salons/:salonId", async (req, res) => {
  try {
    const { salonId } = GetSalonParams.parse({ salonId: Number(req.params.salonId) });
    const { data: salon, error } = await supabase
      .from("salons")
      .select("*")
      .eq("id", salonId)
      .single();

    if (error || !salon) {
      return res.status(404).json({ error: "Salon not found" });
    }
    res.json(formatSalon(salon));
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.get("/api/salons/:salonId/services", async (req, res) => {
  try {
    const { salonId } = GetSalonServicesParams.parse({ salonId: Number(req.params.salonId) });
    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .eq("salon_id", salonId);

    if (error) throw error;
    res.json((services || []).map(s => ({
      id: s.id,
      salonId: s.salon_id,
      name: s.name,
      description: s.description,
      durationMinutes: s.duration_minutes,
      price: Number(s.price),
      createdAt: s.created_at,
    })));
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.post("/api/salons/:salonId/services", async (req, res) => {
  try {
    const { salonId } = CreateServiceParams.parse({ salonId: Number(req.params.salonId) });
    const input = CreateServiceBody.parse(req.body);
    const { data: service, error } = await supabase
      .from("services")
      .insert({
        salon_id: salonId,
        name: input.name,
        description: input.description,
        duration_minutes: input.durationMinutes,
        price: input.price,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      id: service.id,
      salonId: service.salon_id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      price: Number(service.price),
      createdAt: service.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.get("/api/salons/:salonId/slots", async (req, res) => {
  try {
    const { salonId } = GetAvailableSlotsParams.parse({ salonId: Number(req.params.salonId) });
    const query = GetAvailableSlotsQueryParams.parse({
      date: req.query.date,
      serviceId: req.query.serviceId ? Number(req.query.serviceId) : undefined,
    });

    const { data: salon, error: sErr } = await supabase.from("salons").select("*").eq("id", salonId).single();
    if (sErr || !salon) {
      return res.status(404).json({ error: "Salon not found" });
    }

    let durationMinutes = 30;
    if (query.serviceId) {
      const { data: service } = await supabase
        .from("services")
        .select("*")
        .eq("id", query.serviceId)
        .eq("salon_id", salonId)
        .single();
      if (service) durationMinutes = service.duration_minutes;
    }

    const { data: existingBookings, error: bErr } = await supabase
      .from("bookings")
      .select("time, status")
      .eq("salon_id", salonId)
      .eq("date", query.date);

    if (bErr) throw bErr;
    const bookedTimes = new Set((existingBookings || []).filter(b => b.status !== "cancelled").map(b => b.time));

    const slots = [];
    const [openH, openM] = salon.open_time.split(":").map(Number);
    const [closeH, closeM] = salon.close_time.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += durationMinutes) {
      const hour = Math.floor(m / 60);
      const min = m % 60;
      const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      slots.push({ time, available: !bookedTimes.has(time) });
    }
    res.json(slots);
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const query = GetBookingsQueryParams.parse({
      salonId: req.query.salonId ? Number(req.query.salonId) : undefined,
      date: req.query.date as string | undefined,
    });

    let sbQuery = supabase
      .from("bookings")
      .select("*, services(name)");

    if (query.salonId) sbQuery = sbQuery.eq("salon_id", query.salonId);
    if (query.date) sbQuery = sbQuery.eq("date", query.date);

    const { data, error } = await sbQuery;
    if (error) throw error;

    res.json((data || []).map((b: any) => ({
      id: b.id,
      salonId: b.salon_id,
      serviceId: b.service_id,
      clientName: b.client_name,
      clientPhone: b.client_phone,
      date: b.date,
      time: b.time,
      status: b.status,
      notes: b.notes,
      serviceName: b.services?.name ?? "",
      createdAt: b.created_at,
    })));
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const input = CreateBookingBody.parse(req.body);

    const { data: conflict, error: cErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", input.salonId)
      .eq("date", input.date)
      .eq("time", input.time)
      .neq("status", "cancelled");

    if (cErr) throw cErr;
    if (conflict && conflict.length > 0) {
      return res.status(400).json({ error: "This time slot is already booked." });
    }

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .insert({
        salon_id: input.salonId,
        service_id: input.serviceId,
        client_name: input.clientName,
        client_phone: input.clientPhone,
        date: input.date,
        time: input.time,
        notes: input.notes,
        status: "pending",
      })
      .select("*, services(name)")
      .single();

    if (bErr) throw bErr;
    res.status(201).json({
      id: booking.id,
      salonId: booking.salon_id,
      serviceId: booking.service_id,
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      notes: booking.notes,
      serviceName: booking.services?.name ?? "",
      createdAt: booking.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.get("/api/bookings/:bookingId", async (req, res) => {
  try {
    const { bookingId } = GetBookingParams.parse({ bookingId: Number(req.params.bookingId) });
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      id: booking.id,
      salonId: booking.salon_id,
      serviceId: booking.service_id,
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      notes: booking.notes,
      serviceName: booking.services?.name ?? "",
      createdAt: booking.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.patch("/api/bookings/:bookingId", async (req, res) => {
  try {
    const { bookingId } = UpdateBookingStatusParams.parse({ bookingId: Number(req.params.bookingId) });
    const { status } = UpdateBookingStatusBody.parse(req.body);

    const { data: booking, error: uErr } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select("*, services(name)")
      .single();

    if (uErr || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      id: booking.id,
      salonId: booking.salon_id,
      serviceId: booking.service_id,
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      notes: booking.notes,
      serviceName: booking.services?.name ?? "",
      createdAt: booking.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// Detailed Error Handler for Debugging
app.use((err: any, req: any, res: any, next: any) => {
  console.error("API Error:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path
  });
});

export default app;
