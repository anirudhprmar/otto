// read the file, 
// check old_str appears exactly once (reject with a clear error if zero or multiple matches)
// replace, 
// write back

import type {EditFileInpush} from "../agent/tools";

interface EditFileProps {
    path: string | EditFileInpush;
    old_str: string | EditFileInpush;
    new_str: string | EditFileInpush;
}

interface EditFileResult {
    content: string;
}

const MAX_OUTPUT_LENGTH = 200;


export function truncateOutput(text: string, maxLength: number = MAX_OUTPUT_LENGTH): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "\n... [Output truncated]";
  }
  return text;
}

export async function EditFile({ path,old_str,new_str }: EditFileProps): Promise<EditFileResult> {
    try{
        const fs = await import("fs/promises");
        const read_contents = await fs.readFile(path as string, "utf-8");
        if(!old_str || (old_str as string).length == 0) {
            return {content: "Error: old_str is empty"};
        }
        const count = read_contents.split(old_str as string).length - 1;
        if(count !== 1) {
            return {content: `Error: ${count} occurrences of old_str found in the file`};
        }
        
        await fs.writeFile(path as string, new_str as string, "utf-8")

        return { content: truncateOutput(new_str as string) };

    }catch (error){
        console.error(`Error editing file at ${path}:`, error);
        return { content: `Error editing file at ${path}: ${error}` };
    }
}