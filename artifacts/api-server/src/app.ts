import express, { type Application } from "express";
import cors from "cors";
import router from "./routes";
import { db, salonsTable } from "./lib/db/index";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

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
