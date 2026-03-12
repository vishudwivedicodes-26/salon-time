import { Router, type IRouter } from "express";
import healthRouter from "./health";
import salonsRouter from "./salons";
import bookingsRouter from "./bookings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(salonsRouter);
router.use(bookingsRouter);

export default router;
