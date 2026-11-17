import type { Tool } from "../types";
import { readFileTool } from "./read_file";
import { grepTool } from "./grep";
import { lsTool } from "./ls.ts";
import { bashTool } from "./bash.ts";
import { statTool } from "./stat.ts";

export const tools: Tool[] = [bashTool, readFileTool, lsTool, grepTool, statTool];
