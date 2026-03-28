import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
console.log("Testing connection to:", connectionString?.replace(/:[^:@]+@/, ':****@'));

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  console.log("Starting test query...");
  const start = Date.now();
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("Success! Time from DB:", result.rows[0].now);
    console.log("Duration:", Date.now() - start, "ms");
  } catch (err: any) {
    console.error("Connection failed!");
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    if (err.address) console.error("Attempted address:", err.address);
    if (err.port) console.error("Attempted port:", err.port);
  } finally {
    await pool.end();
  }
}

test();
