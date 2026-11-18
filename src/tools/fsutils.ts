import { readdir, stat as fsStat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

export const DEFAULT_IGNORES = [".git", "node_modules", "dist", "build", ".next", "coverage"];

export function globToReg(pattern: string): RegExp {
    const normalized = pattern.split(sep).join('/');
    let out = "";

    for (let i = 0; i < normalized.length; i++) {
        const c = normalized[i];
        if (c === "*"){ // matches char, skips /
            if(normalized[i + 1] === "*"){
                i++;
                if(normalized[i + 1] === "/") i++;
                out+="(?:.*\/)?"; //optionally any char followed by /
            }else {
                out += "[^/]*"; // zero or more chars that aren't /
            }
        }else if(c === "?") {
            out += "[^/]";
        }else if(".+^${}()|[]\\".includes(c)) {
            out += "\\" + c;
        }else {
            out += c
        }
    }

    return new RegExp(`^${out}$`);
}

export function shouldIgnore(name:string, ignores: string[]): boolean{
    return ignores.includes(name);
}

export type DrillEntry = {
    absPath: string;
    relPath: string;
    isDirectory: boolean;
}

export type DrillOptions = {
    maxDepth?: number;
    includesHidden?: boolean;
    ignores?: string[];
}

export async function* drillDown(root: string, opts: DrillOptions = {}): AsyncGenerator<DrillEntry> {
    const ignores = opts.ignores ?? DEFAULT_IGNORES;
    const maxDepth = opts.maxDepth ?? Infinity;
    const includesHidden = opts.includesHidden ?? false;

    async function* recurse(dir:string, depth:number): AsyncGenerator<DrillEntry> {
        let entries;
        try {
            entries = await readdir(dir, {withFileTypes: true})
        } catch {
            return;
        }
        entries.sort((a,b) => a.name.localeCompare(b.name));
        for (const entry of entries) {
            if(!includesHidden && entry.name.startsWith('.') && !ignores.includes(entry.name)){

            }
            if (shouldIgnore(entry.name,ignores)) continue;
            if (!includesHidden && entry.name.startsWith(".")) continue;

            const absPath = join(dir,entry.name);
            const relPath = relative(root,absPath).split(sep).join("/");
            const isDirectory = entry.isDirectory();

            yield { absPath, relPath, isDirectory};
            if (isDirectory && depth < maxDepth) {
                yield* recurse(absPath, depth + 1);
            }
        }
    }

    yield* recurse(root,1);
}

export async function pathExists(p:string): Promise<boolean> {
    try {
        await fsStat(p);
        return true;
    } catch {
        return false;
    }
}