import type { BashInput } from "../agent/tools";
import { execa, type ExecaError } from "execa";

export interface BashExecProps {
  command: string | BashInput;
}

export interface BashExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const MAX_OUTPUT_LENGTH = 2000;


export function truncateOutput(text: string, maxLength: number = MAX_OUTPUT_LENGTH): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "\n... [Output truncated]";
  }
  return text;
}


export async function bashExec({ command }: BashExecProps): Promise<BashExecResult> {
  const cmdString = typeof command === "string" ? command : command.command;
  const workingDir = process.cwd();

  // TODO: Execute command using execa with try/catch, truncating stdout/stderr
  try {
    const {stdout,stderr,exitCode} =  await execa(cmdString,{
        cwd: workingDir,
        shell: true
    })

    return {
        stdout: truncateOutput(stdout),
        stderr: truncateOutput(stderr),
        exitCode: exitCode ?? 0
    }
    
  } catch (error) {
    const err = error as ExecaError;
    return {
      stdout: `No stdout: ${err.stdout?.slice(0,200)}`,
      stderr: `No stderr: ${err.stderr?.slice(0,200)}`,
      exitCode: err.exitCode ?? 1,
    }
  }
}