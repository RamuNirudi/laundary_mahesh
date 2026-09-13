// Runs the API and the Vite dev server together: `npm run dev:all`.
// Dependency-free stand-in for concurrently; either process exiting stops both.

import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";

const processes = [
  { name: "api", command: "node", args: ["server/index.js"] },
  { name: "web", command: isWindows ? "npm.cmd" : "npm", args: ["run", "dev"] },
].map(({ name, command, args }) => {
  const child = spawn(command, args, { stdio: "inherit", shell: isWindows });
  child.on("exit", (code) => {
    console.log(`[dev] ${name} exited (${code}). Stopping.`);
    shutdown(code ?? 0);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill();
  process.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => shutdown(0));
