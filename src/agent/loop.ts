import type { Content } from "@google/genai";
import { generateResponse } from "./client";
import { allTools } from "./tools";
import { bashExec } from "../tools/bash";
import { readFile } from "../tools/read_file";

export default async function runAgentLoop(initialPrompt?: string): Promise<void> {
    
    const contents: Content[] = [
        {
            role: "user",
            parts: [
                {
                    text: initialPrompt || "read the file at src/index.ts and tell me what it does in one word" ,
                },
            ],
        },
    ];
    
    let maxTurns = 0;
    
while (maxTurns <= 2) {
  const result = await generateResponse(contents, allTools);
  
  if (!result.candidates || result.candidates.length === 0) break;
  
  const candidateContent = result.candidates[0]?.content;
  
  if (!candidateContent) break;
  
  contents.push(candidateContent);
  
  if (result.functionCalls && result.functionCalls.length > 0) {
      const fc = result.functionCalls[0];
      const name = fc?.name;
      let res: Record<string, unknown>;
      
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
        } else {
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