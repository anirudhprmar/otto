import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import type { Tool } from "../types";
import { drillDown } from "./fsutil.ts";


const MAX_MATCHES = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024

export const grepTool: Tool = {
    name: "grep",
    description: "search for a patterns within the file and return matched values",
    parameters: {
        type:"object",
        properties: {
            pattern:{ type:"string", description:"Regex pattern to search for"},
            path:{ type:"string", description:"Path or location of the file to work with"},
            glob:{ type:"string", description:"Search for specific text or format within the file i.e exactly '**/*.ts'"},
            ignoreCase:{ type:"boolean", description:"Case insensitive search by default it is false"},
            maxMatches:{ type:"number", description:`Max number of matches found ${MAX_MATCHES}`},
        },
        required:['pattern']
    },
    async execute(args) {
        const root = resolve(process.cwd(), String(args.path ?? "."));
        const patternStr = String(args.pattern);
        const ignoreCase = Boolean(args.ignoreCase);
        const maxMatches = typeof args.maxMatches === "number" ? args.maxMatches : MAX_MATCHES;
        const globPattern = args.glob ? String(args.glob) : undefined;

        let globalReg : RegExp | undefined;

        if(globPattern){
            const {globToReg} =  await import("./fsutils.ts")
            globalReg = globToReg(globPattern)
        }

        let reg: RegExp;
        try {
            reg = new RegExp(patternStr, ignoreCase ? "i" : "")
        } catch (e) {
            return `invalid regex: ${e instanceof Error ? e.message : String(e)}`
        }

        const results: string[] = [];
        let matchCount = 0;

        outer : for await (const entry of drillDown(root)) {
            if(entry.isDirectory) continue;
            if(globalReg && !globalReg.test(entry.relPath)) continue;

            let content: string;

            try {
                const buf = await readFile(entry.absPath);
                if(buf.length > MAX_FILE_SIZE) continue;
                if(buf.includes(0)) continue;
                content = buf.toString("utf-8")
            } catch {
                continue;
            }

            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if(reg.test(lines[i])) {
                    results.push(`${entry.relPath}:${i + 1}:${lines[i]}`);
                    matchCount++;
                    if (matchCount >= maxMatches) {
                        results.push(`truncated at ${maxMatches} matches`)
                        break outer;
                    }
                }
                
            }
        }

        if(results.length === 0) return "(no matches)";
        return results.join("\n")
    },
}


