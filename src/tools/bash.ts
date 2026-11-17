import { spawn } from "node:child_process";
import type { Tool } from "../types.ts";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

const MAX_OUTPUT_LENGTH = 2000;
const MAX_BYTES = 50 * 1024;

export function truncateOutput(text: string, maxLength = MAX_OUTPUT_LENGTH, maxBytes = MAX_BYTES): string {
  const lines = text.split('\n')
  let kept = lines.slice(-maxLength);
  while (kept.length > 1 && Buffer.byteLength(kept.join('\n')) > maxBytes)
  kept.shift();
  let out = kept.join("\n");

  if (Buffer.byteLength(out) > maxBytes) out = out.slice(-maxBytes);

  if (kept.length === lines.length && out.length === text.length) return text;

  return `[truncated: showing the last ${kept.length} of ${lines.length}lines\n${out}]`;
}

export function findBash(): string {
  if(process.platform !== "win32") return "bash";
  const options = [
    `${process.env.ProgramFiles}\\Git\\bin\\bash.exe`,
    `${process.env["ProgramFiles(x86)"]}\\Git\\bin\\bash.exe`,
    `${process.env.LOCALAPPDATA}\\Programs\\Git\\bin\\bash.exe`
  ]
  const known = options.find((p) => existsSync(p));
  if (known) return known;

  for(const dir of (process.env.PATH ?? "").split(delimiter)){
    if (!dir || /\\system32$/i.test(dir.replace(/\\+$/, ""))) continue;
    const option = join(dir, "bash.exe");
    if (existsSync(option)) return option;
  }
  return "bash";
}

export function execBash(cmd:string,timeoutMs: number): Promise<string> {
  return new Promise ((resolve) => {
    const child = spawn(findBash(), ["-c",cmd], {cwd: process.cwd(),windowsHide: true});
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const timer = setTimeout(()=> {
      if(process.platform === "win32") spawn("taskkill", ["/F","/T","/PID", String(child.pid)]);
      else child.kill("SIGKILL");
      out += `\n[timed out after ${timeoutMs / 1000}s]`
    },timeoutMs);

    child.on("error", (e) => {
      clearTimeout(timer);
      resolve(`failed to start bash: ${e.message}`)
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(`${out}\n[exit code: ${code}]`)
    })
  })
}

export const bashTool: Tool = {
   name: "bash",
  description: "Run a bash command in the current folder. Returns stdout, stderr and the exit code.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "The bash command to run" },
      timeout: { type: "number", description: "Timeout in seconds (default 30)" },
    },
    required: ["command"],
  },
  async execute(args) {
    const seconds = typeof args.timeout === "number" ? args.timeout : 30;
    return truncateOutput(await execBash(String(args.command), seconds * 1000));
  },
}