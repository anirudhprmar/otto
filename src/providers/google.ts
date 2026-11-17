import { GoogleGenAI } from "@google/genai";
import type { ContentBlock, Message, Provider, StopReason } from "../types";

type GoogleInputStep =
  | { type: "user_input"; content: Array<{ type: "text"; text: string }> }
  | { type: "model_output"; content: Array<{ type: "text"; text: string }> }
  | {
      type: "function_call";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: "function_result";
      call_id: string;
      name: string;
      result: string;
      is_error: boolean;
    };

function toGoogleModel(messages: Message[]): GoogleInputStep[] {
  const steps: GoogleInputStep[] = [];

  for (const message of messages) {
    if (message.role === "user") {
      steps.push({
        type: "user_input",
        content: [{ type: "text", text: message.content }],
      });
    } else if (message.role === "assistant") {
      for (const block of message.content) {
        if (block.type === "text") {
          steps.push({
            type: "model_output",
            content: [{ type: "text", text: block.text }],
          });
        } else {
          steps.push({
            type: "function_call",
            id: block.id,
            name: block.name,
            arguments: block.arguments,
          });
        }
      }
    } else {
      steps.push({
        type: "function_result",
        call_id: message.toolCallId,
        name: message.toolName,
        result: message.content,
        is_error: message.isError,
      });
    }
  }

  return steps;
}

function parseArguments(
  argumentsJson: string,
  toolName: string,
): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(argumentsJson) as unknown;
  } catch (error) {
    throw new Error(
      `Invalid arguments returned for Google tool "${toolName}"`,
      {
        cause: error,
      },
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      `Arguments returned for Google tool "${toolName}" must be an object`,
    );
  }

  return parsed as Record<string, unknown>;
}

export function createGoogle(
  name: string,
  apiKey: string,
  defaultModel: string,
): Provider {
  const client = new GoogleGenAI({ apiKey });

  return {
    name,
    defaultModel,
    async *stream({ messages, model, system, tools = [] }) {
      const stream = await client.interactions.create({
        model,
        input: toGoogleModel(messages),
        system_instruction: system,
        tools:
          tools.length > 0
            ? tools.map((tool) => ({
                type: "function" as const,
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              }))
            : undefined,
        stream: true,
      });

      const content: ContentBlock[] = [];
      const textBlocks = new Map<
        number,
        Extract<ContentBlock, { type: "text" }>
      >();
      const calls = new Map<
        number,
        {
          block: Extract<ContentBlock, { type: "toolCall" }>;
          argumentsJson: string;
        }
      >();
      let finalInteraction:
        | {
            status: string;
            usage?: {
              total_input_tokens?: number;
              total_output_tokens?: number;
            };
          }
        | undefined;

      for await (const event of stream) {
        if (event.event_type === "error") {
          throw new Error(
            event.error?.message ?? "Google interaction stream failed",
          );
        }

        if (event.event_type === "interaction.status_update") {
          if (event.status === "failed" || event.status === "cancelled") {
            throw new Error(`Google interaction ${event.status}`);
          }
          continue;
        }

        if (event.event_type === "interaction.completed") {
          finalInteraction = event.interaction;
          continue;
        }

        if (event.event_type === "step.start") {
          if (event.step.type === "model_output") {
            const block = { type: "text" as const, text: "" };
            textBlocks.set(event.index, block);
            content.push(block);
          } else if (event.step.type === "function_call") {
            const block = {
              type: "toolCall" as const,
              id: event.step.id,
              name: event.step.name,
              arguments: event.step.arguments,
            };
            calls.set(event.index, { block, argumentsJson: "" });
            content.push(block);
          }
          continue;
        }

        if (event.event_type === "step.delta") {
          if (event.delta.type === "text") {
            const block = textBlocks.get(event.index);
            if (!block) {
              throw new Error(
                "Google emitted text without starting a model output step",
              );
            }
            block.text += event.delta.text;
            yield { type: "text_delta", delta: event.delta.text };
          } else if (event.delta.type === "arguments_delta") {
            const call = calls.get(event.index);
            if (!call) {
              throw new Error(
                "Google emitted tool arguments without starting a function call",
              );
            }
            call.argumentsJson += event.delta.arguments ?? "";
          }
        }
      }

      if (!finalInteraction) {
        throw new Error(
          "Google interaction stream ended without a final message",
        );
      }
      if (
        finalInteraction.status === "failed" ||
        finalInteraction.status === "cancelled"
      ) {
        throw new Error(`Google interaction ${finalInteraction.status}`);
      }

      for (const { block, argumentsJson } of calls.values()) {
        if (argumentsJson) {
          block.arguments = parseArguments(argumentsJson, block.name);
        }
      }

      const finalContent = content.filter(
        (block) => block.type !== "text" || block.text.length > 0,
      );
      const stopReason: StopReason =
        finalContent.some((block) => block.type === "toolCall") ||
        finalInteraction.status === "requires_action"
          ? "toolUse"
          : finalInteraction.status === "incomplete" ||
              finalInteraction.status === "budget_exceeded"
            ? "length"
            : "stop";

      yield {
        type: "done",
        message: {
          role: "assistant",
          content: finalContent,
          usage: {
            input: finalInteraction.usage?.total_input_tokens ?? 0,
            output: finalInteraction.usage?.total_output_tokens ?? 0,
          },
          stopReason,
        },
      };
    },
  };
}
