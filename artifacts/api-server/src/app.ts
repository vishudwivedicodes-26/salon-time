import express, { type Application } from "express";
import cors from "cors";
import router from "./routes";
import { supabase } from "./lib/db/index";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Detailed Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ 
        error: "Internal Server Error", 
        message: err.message,
        path: req.path
    });
});

export default app;
