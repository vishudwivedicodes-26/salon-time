import app from "../artifacts/api-server/src/app";

// Direct diagnostic for Vercel
(app as any).get("/api/vercel-check", (req: any, res: any) => {
  res.json({ 
    status: "ok", 
    message: "Vercel entry point is working",
    hasDbUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV
  });
});

export default app;
