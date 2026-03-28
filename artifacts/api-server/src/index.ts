import dns from "node:dns";
dns.setDefaultResultOrder('ipv4first');

import app from "./app";

const rawPort = process.env.PORT || "3000";
const port = parseInt(rawPort, 10);

if (isNaN(port)) {
  console.error(`Invalid PORT: ${rawPort}`);
  process.exit(1);
}

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});

server.on("error", (err: any) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
