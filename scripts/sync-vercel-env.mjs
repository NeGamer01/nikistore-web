import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const envPath = new URL("../.env.local", import.meta.url);
const envName = process.argv[2] || "production";

function parseEnv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
    .filter(([key]) => key);
}

function runVercel(args, input = "") {
  const bin = process.platform === "win32" ? "npx.cmd" : "npx";
  return spawnSync(bin, ["vercel", ...args], {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"]
  });
}

const entries = parseEnv(await readFile(envPath, "utf8"));

for (const [key, value] of entries) {
  console.log(`Sync ${key} -> ${envName}`);
  runVercel(["env", "rm", key, envName, "--yes"]);
  const result = runVercel(["env", "add", key, envName], `${value}\n`);
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log(`Done. ${entries.length} env vars synced to Vercel ${envName}.`);
