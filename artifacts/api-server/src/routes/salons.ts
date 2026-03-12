import { Router, type IRouter } from "express";
import { db, salonsTable, servicesTable, bookingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateSalonBody,
  CreateServiceBody,
  CreateServiceParams,
  GetAvailableSlotsQueryParams,
  GetAvailableSlotsParams,
  GetSalonParams,
  GetSalonServicesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/salons", async (_req, res) => {
  const salons = await db.select().from(salonsTable);
  res.json(salons.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/salons", async (req, res) => {
  const input = CreateSalonBody.parse(req.body);
  const [salon] = await db.insert(salonsTable).values(input).returning();
  res.status(201).json({ ...salon, createdAt: salon.createdAt.toISOString() });
});

router.get("/salons/:salonId", async (req, res) => {
  const { salonId } = GetSalonParams.parse({ salonId: Number(req.params.salonId) });
  const [salon] = await db.select().from(salonsTable).where(eq(salonsTable.id, salonId));
  if (!salon) {
    res.status(404).json({ error: "Salon not found" });
    return;
  }
  res.json({ ...salon, createdAt: salon.createdAt.toISOString() });
});

router.get("/salons/:salonId/services", async (req, res) => {
  const { salonId } = GetSalonServicesParams.parse({ salonId: Number(req.params.salonId) });
  const services = await db.select().from(servicesTable).where(eq(servicesTable.salonId, salonId));
  res.json(services.map(s => ({
    ...s,
    price: Number(s.price),
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/salons/:salonId/services", async (req, res) => {
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

router.get("/salons/:salonId/slots", async (req, res) => {
  const { salonId } = GetAvailableSlotsParams.parse({ salonId: Number(req.params.salonId) });
  const query = GetAvailableSlotsQueryParams.parse({
    date: req.query.date,
    serviceId: req.query.serviceId ? Number(req.query.serviceId) : undefined,
  });

  const [salon] = await db.select().from(salonsTable).where(eq(salonsTable.id, salonId));
  if (!salon) {
    res.status(404).json({ error: "Salon not found" });
    return;
  }

  let durationMinutes = 30;
  if (query.serviceId) {
    const [service] = await db.select().from(servicesTable).where(
      and(eq(servicesTable.id, query.serviceId), eq(servicesTable.salonId, salonId))
    );
    if (service) durationMinutes = service.durationMinutes;
  }

  const existingBookings = await db.select().from(bookingsTable).where(
    and(
      eq(bookingsTable.salonId, salonId),
      eq(bookingsTable.date, query.date),
    )
  );

  const bookedTimes = new Set(
    existingBookings
      .filter(b => b.status !== "cancelled")
      .map(b => b.time)
  );

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

export default router;
