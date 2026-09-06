import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = process.env.TEST_PORT || "3101";
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const testFile = fileURLToPath(new URL("../tests/integration/http.test.mjs", import.meta.url));
const server = spawn(process.execPath, [nextCli, "start", "-p", port], { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
server.stdout.on("data", (chunk) => { output += chunk; });
server.stderr.on("data", (chunk) => { output += chunk; });

async function waitUntilReady() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Test server exited early:\n${output}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for test server:\n${output}`);
}

try {
  await waitUntilReady();
  const tests = spawn(process.execPath, ["--test", testFile], { env: { ...process.env, TEST_BASE_URL: baseUrl }, stdio: "inherit" });
  const code = await new Promise((resolve, reject) => {
    tests.once("error", reject);
    tests.once("exit", (value) => resolve(value ?? 1));
  });
  if (code !== 0) process.exitCode = code;
} finally {
  server.kill();
}
