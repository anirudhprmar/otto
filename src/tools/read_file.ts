import { resolve } from "node:path";
import type { Tool } from "../types.ts";

export const readFileTool: Tool = {
    name: "read",
    description:"read a file and return its contents",
    parameters: {
        type:"object",
        properties: {
            path: {
                type: "string",
                description: "path to the file, relative to the current folder"
            }
        },
        required:["path"]
    },
    async execute(args) {
        const fs = await import("fs/promises");
        const contents = fs.readFile(resolve(process.cwd(), String(args.path)), "utf8");
        return contents
    }
}