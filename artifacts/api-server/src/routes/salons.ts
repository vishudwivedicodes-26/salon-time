import { Router } from "express";
import { supabase } from "../lib/db";
import * as zod from "zod";

const router = Router();

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

export const CreateServiceBody = zod.object({
  name: zod.string(),
  description: zod.string().nullish(),
  durationMinutes: zod.number(),
  price: zod.number(),
});

export const GetAvailableSlotsQueryParams = zod.object({
  date: zod.string(),
  serviceId: zod.coerce.number().optional(),
});

// --- Helpers ---
function stripPin(salon: any) {
  if (!salon) return null;
  const { pin, ...rest } = salon;
  return rest;
}

function formatSalon(salon: any) {
  if (!salon) return null;
  return stripPin({ 
    id: salon.id,
    name: salon.name,
    ownerName: salon.owner_name,
    phone: salon.phone,
    address: salon.address,
    openTime: salon.open_time,
    closeTime: salon.close_time,
    createdAt: salon.created_at
  });
}

// --- Routes ---

// List all salons
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("salons").select("*");
    if (error) throw error;
    res.json((data || []).map(s => formatSalon(s)));
  } catch (error: any) {
    console.error("List salons failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new salon
router.post("/", async (req, res) => {
  try {
    console.log("Received salon registration request:", req.body);
    const input = CreateSalonBody.parse(req.body);
    
    // Map CamelCase to snake_case for Supabase
    const dbInput = {
      name: input.name,
      owner_name: input.ownerName,
      phone: input.phone,
      address: input.address,
      open_time: input.openTime,
      close_time: input.closeTime,
      pin: input.pin
    };

    console.log("Inserting into database via HTTPS...");
    const { data, error } = await supabase.from("salons").insert(dbInput).select().single();
    
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    
    console.log("Insertion successful, result:", data);
    res.status(201).json(formatSalon(data));
  } catch (error: any) {
    console.error("Salon registration failed:", error);
    res.status(400).json({ 
      error: error.message,
      detail: error.details || error.stack
    });
  }
});

// Salon login
router.post("/login", async (req, res) => {
  try {
    const { salonId, pin } = SalonLoginBody.parse(req.body);
    const { data: salon, error } = await supabase
      .from("salons")
      .select("*")
      .eq("id", salonId)
      .single();
      
    if (error || !salon) {
      res.status(404).json({ error: "Salon not found" });
      return;
    }
    if (salon.pin !== pin) {
      res.status(401).json({ error: "Galat PIN hai. Dobara try karein." });
      return;
    }
    res.json(formatSalon(salon));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get salon details
router.get("/:salonId", async (req, res) => {
  try {
    const { salonId } = GetSalonParams.parse({ salonId: req.params.salonId });
    const { data: salon, error } = await supabase
      .from("salons")
      .select("*")
      .eq("id", salonId)
      .single();
      
    if (error || !salon) {
      res.status(404).json({ error: "Salon not found" });
      return;
    }
    res.json(formatSalon(salon));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get salon services
router.get("/:salonId/services", async (req, res) => {
  try {
    const { salonId } = GetSalonParams.parse({ salonId: req.params.salonId });
    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .eq("salon_id", salonId);
      
    if (error) throw error;
    res.json((services || []).map(s => ({
      ...s,
      salonId: s.salon_id,
      durationMinutes: s.duration_minutes,
      price: Number(s.price),
      createdAt: s.created_at,
    })));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create salon service
router.post("/:salonId/services", async (req, res) => {
  try {
    const { salonId } = GetSalonParams.parse({ salonId: req.params.salonId });
    const input = CreateServiceBody.parse(req.body);
    
    const dbInput = {
      salon_id: salonId,
      name: input.name,
      description: input.description,
      duration_minutes: input.durationMinutes,
      price: input.price
    };

    const { data: service, error } = await supabase
      .from("services")
      .insert(dbInput)
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json({
      ...service,
      salonId: service.salon_id,
      durationMinutes: service.duration_minutes,
      price: Number(service.price),
      createdAt: service.created_at,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get available slots
router.get("/:salonId/slots", async (req, res) => {
  try {
    const { salonId } = GetSalonParams.parse({ salonId: req.params.salonId });
    const query = GetAvailableSlotsQueryParams.parse({
      date: req.query.date,
      serviceId: req.query.serviceId,
    });

    const { data: salon, error: salonErr } = await supabase
      .from("salons")
      .select("*")
      .eq("id", salonId)
      .single();
      
    if (salonErr || !salon) {
      res.status(404).json({ error: "Salon not found" });
      return;
    }

    let durationMinutes = 30;
    if (query.serviceId) {
      const { data: service } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", query.serviceId)
        .eq("salon_id", salonId)
        .single();
      if (service) durationMinutes = service.duration_minutes;
    }

    const { data: existingBookings, error: bookErr } = await supabase
      .from("bookings")
      .select("time, status")
      .eq("salon_id", salonId)
      .eq("date", query.date);
      
    if (bookErr) throw bookErr;
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
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
