import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

console.log("Testing Supabase SDK Connection...");
console.log("URL:", supabaseUrl);
console.log("Key (first 10 chars):", supabaseKey.substring(0, 10));

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from("salons").select("*").limit(1);
    if (error) {
      console.error("Supabase Error:", error.message);
      console.error("Full Error:", JSON.stringify(error, null, 2));
    } else {
      console.log("Success! Data received:", data);
    }
  } catch (err: any) {
    console.error("Unexpected Error:", err.message);
  }
}

test();
