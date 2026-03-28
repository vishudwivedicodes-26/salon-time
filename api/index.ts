import express, { type Application } from "express";
import cors from "cors";
// Use absolute-style paths relative to the root for better Vercel bundling
import router from "../artifacts/api-server/src/routes/index.js";
import { db, salonsTable } from "../artifacts/api-server/src/lib/db/index.js";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Backend routes
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
