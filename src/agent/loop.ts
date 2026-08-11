import type { Content } from "@google/genai";
import { generateResponse } from "./client";
import { allTools } from "./tools";
import { bashExec } from "../tools/bash";
import { readFile } from "../tools/read_file";
import { EditFile } from "../tools/edit_file";
import { glob } from "../tools/glob";

export default async function runAgentLoop(initialPrompt?: string): Promise<void> {
    
    const contents: Content[] = [
        {
            role: "user",
            parts: [
                {
                    text: initialPrompt || "go to index.ts and implement taking input from argument which uses commander, keep it very minimal change very short" ,
                },
            ],
        },
    ];
    
    let maxTurns = 0;
    
while (maxTurns <= 50) {
  console.log(maxTurns++)
  const result = await generateResponse(contents, allTools);
  
  if (!result.candidates || result.candidates.length === 0) break;
  
  const candidateContent = result.candidates[0]?.content;
  
  if (!candidateContent) break;
  
  contents.push(candidateContent);
  if (result.functionCalls && result.functionCalls.length > 0) {
      const fc = result.functionCalls[0];
      const name = fc?.name;
      let res: Record<string, unknown>;

      console.log(result.functionCalls?.length ? "→ tool call: " + name : "→ final text")
      
      if (name === "bash") {
          if (typeof fc?.args?.command !== "string") {
              console.log("Invalid command argument");
              continue;
            }
            const toolRes = await bashExec({ command: fc.args.command as string });
            res = toolRes as unknown as Record<string, unknown>;
        } else if (name === "read_file") {
          if (typeof fc?.args?.path !== "string") {
              console.log("Invalid path argument");
              continue;
            }
            const toolRes = await readFile({ path: fc.args.path as string });
            res = { text: toolRes };
        } else if (name === "edit_file") {
          if (typeof fc?.args?.path !== "string" || typeof fc?.args?.old_str !== "string" || typeof fc?.args?.new_str !== "string") {
              console.log("Invalid edit arguments");
              continue;
            }
            const toolRes = await EditFile({ path: fc.args.path as string, old_str: fc.args.old_str as string, new_str: fc.args.new_str as string });
            res = { text: toolRes };
        } else if (name === "glob") {
          if (typeof fc?.args?.pattern !== "string" || typeof fc?.args?.path !== "string") {
              console.log("Invalid glob arguments");
              continue;
            }
            const toolRes = await glob({ pattern: fc.args.pattern as string, path: fc.args.path as string });
            res = { text: toolRes };
        } 
        
        else {
            res = { error: "no tool response" };
        }
        
        contents.push({
            role: "user",
            parts: [
                {
                    functionResponse: {
                        name,
                        response: res,
                    },
                },
            ],
        });
    } else {
        console.log("Model Response: ", result.text || []);
        break;
    }
    
    maxTurns++;
}

}