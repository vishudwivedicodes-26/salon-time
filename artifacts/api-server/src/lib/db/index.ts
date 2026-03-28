import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseKey === "YOUR_SUPABASE_ANON_KEY_HERE") {
  console.warn("Supabase credentials are not fully configured. HTTPS-based connection will fail.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder"
);

// We keep the drizzle schema exports for validation and typing
export * from "./schema";
