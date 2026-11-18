import { resolve } from "node:path";
import type { Tool } from "../types.ts";
import { globToReg, drillDown } from "./fsutils.ts";

const LIMIT = 2000;

export const findTool: Tool = {
  name: "find",
  description:
    "Find files/directories by name, matching a substring, glob pattern (e.g. '**/*.test.ts') or regex, recursively under a path.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Substring to match against file/directory names" },
      glob: { type: "string", description: "Glob pattern to match against the relative path, e.g. '**/*.ts'" },
      regex: { type: "string", description: "Regex to match against the relative path" },
      path: { type: "string", description: "Directory to search under, relative to the current folder (default '.')" },
      type: { type: "string", description: "Filter by 'file' or 'dir' (default: both)" },
      includesHidden: { type: "boolean", description: "Include dotfiles/dot-directories (default false)" },
    },
  },
  async execute(args) {
      const root = resolve(process.cwd(), String(args.name ?? "."));
      const name = args.name ? String(args.name) : undefined;
      const glob = args.glob ? String(args.glob) : undefined;
      const regex = args.regex ? String(args.regex) : undefined;
      const typeToLook = args.type ? String(args.type) : undefined;
      const includesHidden = Boolean(args.includesHidden);

      if(!name && !glob && !regex){
        return "Error: missing a name or glob or regex to look for"
      }

      let globRegex: RegExp | undefined;
      if(glob) globRegex = globToReg(glob);
      let regexRegex: RegExp | undefined;
      if(regex) {
        try {
            regexRegex = new RegExp(regex)
        } catch (e) {
            return `invalid regex: ${e instanceof Error ? e.message : String(e)}`;
        }
      }

      const results: string[] = [];
      for await (const entry of drillDown(root, {includesHidden})) {
        if (typeToLook === "file" && !entry.isDirectory) continue;
        if (typeToLook === "dir" && !entry.isDirectory) continue;

        const baseName = entry.relPath.split('/').pop() ?? entry.relPath;
        if (name && !baseName.toLowerCase().includes(name.toLowerCase())) continue;
        if (globRegex && !globRegex.test(entry.relPath)) continue;
        if (regexRegex && !regexRegex.test(entry.relPath)) continue;

        results.push(entry.isDirectory ? `${entry.relPath}/` : entry.relPath);
        if (results.length >= LIMIT) {
            results.push(`[truncated at ${LIMIT} results]`);
            break;
        }
      }
      
      if (results.length === 0) return "(no matches)";
      return results.join("\n");
  },

}