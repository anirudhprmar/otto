import z from "zod";
import { Type, type FunctionDeclaration, type Tool } from "@google/genai";

export const bashInputSchema = z.object({
  command: z.string().describe("The shell command to execute"),
});

export const readFileInputSchema = z.object({
  path: z.string().describe("The path to the file to read"),
})

export const editFileInpushSchema = z.object({
  path: z.string().describe("The path to the file to edit"),
  old_str: z.string().describe("The string to replace"),
  new_str: z.string().describe("The string to replace with"),
})

export type ReadFileInput = z.infer<typeof readFileInputSchema>;
export type BashInput = z.infer<typeof bashInputSchema>;
export type EditFileInpush = z.infer<typeof editFileInpushSchema>;


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

export const readFileTool: FunctionDeclaration = {
  name: "read_file",
  description: "Reads the contents of a file and returns it as a string.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "The path to the file to read"
      }
    },
    required: ["path"]
    }
}

// export const writeFileTool: FunctionDeclaration = {
//   name: "write_file",
//   description: "Writes a string to a file.",
//   parameters: {
//     type: Type.OBJECT,
//     properties: {
//       path:{
//         type: Type.STRING,
//         description: "The path to the file to write to"
//       },
//       content:{
//         type: Type.STRING,
//         description: "The content to write to the file"
//       }
//     },
//     required: ["path", "content"]
// }
// }

// export const glob: FunctionDeclaration = {
//   name: "glob",
//   description: "Finds files matching a pattern.",
//   parameters: {
//     type: Type.OBJECT,
//     properties: {
//       pattern:{
//         type: Type.STRING,
//         description: "The glob pattern to match"
//       }
//     },
//     required: ["pattern"]
// }
// }

export const editFileTool: FunctionDeclaration = {
  name: "edit_file",
  description: "Edits the contents of a file.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path:{
        type: Type.STRING,
        description: "The glob pattern to match"
      },
      old_str:{
        type: Type.STRING,
        description: "The string to replace"
      },
      new_str:{
        type: Type.STRING,
        description: "The string to replace with"
      }
    },
    required: ["pattern"]
}
}

export const allTools: Tool[] = [
  {
    functionDeclarations:[bashTool, readFileTool]
  }
];
