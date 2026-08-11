import type {GlobInput} from "../agent/tools";

interface GlobProps {
    pattern?: string | GlobInput;
    path?:string;
}

interface GlobResult {
    content: string;
}

const MAX_OUTPUT_LENGTH = 200;


export function truncateOutput(text: string, maxLength: number = MAX_OUTPUT_LENGTH): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "\n... [Output truncated]";
  }
  return text;
}

export async function glob({ path,pattern }: GlobProps): Promise<GlobResult> {
    try{
        const fs = await import("fs/promises");
        const contents = await fs.readdir(path as string || pattern as string)

        return { content: truncateOutput(contents.join("\n")) };

    }catch (error){
        console.error(`Error reading file at ${pattern}:`, error);
        return { content: `Error reading file at ${pattern}: ${error}` };
    }
}