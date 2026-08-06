import z from "zod";
import { Type, type FunctionDeclaration, type Tool } from "@google/genai";

export const bashInputSchema = z.object({
  command: z.string().describe("The shell command to execute"),
});

export type BashInput = z.infer<typeof bashInputSchema>;


export const bashTool: FunctionDeclaration = {
  name: "bash",
  description: "Executes a shell command in the agent's current working directory and returns its stdout, stderr, and exit code.", 
  parameters: {
    type: Type.OBJECT,
    properties: {
        command: {
            type: Type.STRING,
            description: "The shell command to execute"
        }
    },
    required: ["command"]
  },
};


export const allTools: Tool[] = [
  {
    functionDeclarations:[bashTool]
  }
];
