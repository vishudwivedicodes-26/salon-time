import express, { type Request, type Response } from "express";

const app = express();

app.get("/api/healthz", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    mode: "minimal-vercel-entry",
    hasDbUrl: !!process.env.DATABASE_URL
  });
});

export default app;
