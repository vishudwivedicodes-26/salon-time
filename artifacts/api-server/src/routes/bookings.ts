import { Router } from "express";
import { supabase } from "../lib/db";
import * as zod from "zod";

const router = Router();

// --- Validation Schemas ---
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

export const UpdateBookingStatusBody = zod.object({
  status: zod.string(),
});

// --- Routes ---

// List bookings
router.get("/", async (req, res) => {
  try {
    const query = GetBookingsQueryParams.parse({
      salonId: req.query.salonId,
      date: req.query.date,
    });

    let supabaseQuery = supabase
      .from("bookings")
      .select("*, services(name)");

    if (query.salonId) supabaseQuery = supabaseQuery.eq("salon_id", query.salonId);
    if (query.date) supabaseQuery = supabaseQuery.eq("date", query.date);

    const { data: rows, error } = await supabaseQuery;
    if (error) throw error;

    res.json((rows || []).map(r => ({
      id: r.id,
      salonId: r.salon_id,
      serviceId: r.service_id,
      clientName: r.client_name,
      clientPhone: r.client_phone,
      date: r.date,
      time: r.time,
      status: r.status,
      notes: r.notes,
      serviceName: (r.services as any)?.name ?? "",
      createdAt: r.created_at,
    })));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Create a booking
router.post("/", async (req, res) => {
  try {
    const input = CreateBookingBody.parse(req.body);

    const { data: conflict, error: confErr } = await supabase
      .from("bookings")
      .select("status")
      .eq("salon_id", input.salonId)
      .eq("date", input.date)
      .eq("time", input.time);
      
    if (confErr) throw confErr;

    const active = (conflict || []).filter(b => b.status !== "cancelled");
    if (active.length > 0) {
      return res.status(400).json({ error: "This time slot is already booked." });
    }

    const { data: booking, error: insErr } = await supabase
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

    if (insErr) throw insErr;

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
      serviceName: (booking.services as any)?.name ?? "",
      createdAt: booking.created_at,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Get booking details
router.get("/:bookingId", async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (isNaN(bookingId)) return res.status(400).json({ error: "Invalid booking ID" });

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
      serviceName: (booking.services as any)?.name ?? "",
      createdAt: booking.created_at,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Update booking status
router.patch("/:bookingId", async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (isNaN(bookingId)) return res.status(400).json({ error: "Invalid booking ID" });

    const { status } = UpdateBookingStatusBody.parse(req.body);

    const { data: booking, error: updErr } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select("*, services(name)")
      .single();

    if (updErr || !booking) {
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
      serviceName: (booking.services as any)?.name ?? "",
      createdAt: booking.created_at,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
