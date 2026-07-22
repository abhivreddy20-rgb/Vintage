import { spawn } from "node:child_process";

const processes = [
  spawn("node", ["server.mjs"], { stdio: "inherit" }),
  spawn("npm", ["run", "dev:vite"], { stdio: "inherit" }),
];

let shuttingDown = false;

function stopAll(signal = "SIGTERM") {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const child of processes) {
  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0) {
      stopAll();
      process.exitCode = code ?? 1;
    }

    if (signal === "SIGINT" || signal === "SIGTERM") {
      process.exitCode = 0;
    }
  });
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
