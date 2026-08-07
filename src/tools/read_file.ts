import type {ReadFileInput} from "../agent/tools";

interface ReadFileProps {
    path: string | ReadFileInput;
}

interface ReadFileResult {
    content: string;
}

const MAX_OUTPUT_LENGTH = 200;


export function truncateOutput(text: string, maxLength: number = MAX_OUTPUT_LENGTH): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "\n... [Output truncated]";
  }
  return text;
}

export async function readFile({ path }: ReadFileProps): Promise<ReadFileResult> {
    try{
        const fs = await import("fs/promises");
        const contents = await fs.readFile(path as string, "utf-8")

        return { content: truncateOutput(contents) };

    }catch (error){
        console.error(`Error reading file at ${path}:`, error);
        return { content: `Error reading file at ${path}: ${error}` };
    }
}