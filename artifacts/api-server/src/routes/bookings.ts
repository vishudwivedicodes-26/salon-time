import { Router, type IRouter } from "express";
import { db, bookingsTable, servicesTable } from "../lib/db/index";
import { eq, and } from "drizzle-orm";
import {
  CreateBookingBody,
  GetBookingParams,
  GetBookingsQueryParams,
  UpdateBookingStatusBody,
  UpdateBookingStatusParams,
} from "../lib/api-zod/index";

const router: IRouter = Router();

router.get("/bookings", async (req, res) => {
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

router.post("/bookings", async (req, res) => {
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
    res.status(400).json({ error: "This time slot is already booked. Please choose another time." });
    return;
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

router.get("/bookings/:bookingId", async (req, res) => {
  const { bookingId } = GetBookingParams.parse({ bookingId: Number(req.params.bookingId) });

  const rows = await db.select({
    booking: bookingsTable,
    service: servicesTable,
  })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(eq(bookingsTable.id, bookingId));

  if (rows.length === 0) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const { booking, service } = rows[0];
  res.json({
    ...booking,
    serviceName: service.name,
    createdAt: booking.createdAt.toISOString(),
  });
});

router.patch("/bookings/:bookingId", async (req, res) => {
  const { bookingId } = UpdateBookingStatusParams.parse({ bookingId: Number(req.params.bookingId) });
  const { status } = UpdateBookingStatusBody.parse(req.body);

  const [booking] = await db
    .update(bookingsTable)
    .set({ status })
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, booking.serviceId));

  res.json({
    ...booking,
    serviceName: service?.name ?? "",
    createdAt: booking.createdAt.toISOString(),
  });
});

export default router;
