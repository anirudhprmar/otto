import OpenAI from "openai";
import type { ContentBlock, Message, Provider, StopReason } from "../types";


function toOpenAI(messages: Message[]): OpenAI.ChatCompletionMessageParam[] {
  return messages.map((m): OpenAI.ChatCompletionMessageParam => {
    if (m.role === "user") return { role: "user", content: m.content };

    if (m.role === "assistant") {
      const text = m.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("");
      const calls = m.content.filter((b)=> b.type === "toolCall");

      return {
        role: "assistant",
        content: text || null,
        tool_calls: calls.length ? calls.map((c) => ({
          id: c.id,
          type: "function" as const,
          function: {
            name: c.name,
            arguments: JSON.stringify(c.arguments),
          },
        })) : undefined,
      }
    } 
    
    return {role:"tool", tool_call_id: m.toolCallId, content: m.content}
  });
}

export function createFlmOpenAICompat(
  name: string,
  baseURL: string,
  apiKey: string,
  defaultModel: string,
): Provider {
  const client = new OpenAI({
    baseURL,
    apiKey,
  });
  return {
    name,
    defaultModel,
    async *stream({ messages, model, system, tools = [] }) {
      const chat = toOpenAI(messages);
      const stream = await client.chat.completions.create({
        model,
        messages: system
          ? [{ role: "system", content: system }, ...chat]
          : chat,
        stream: true,
        stream_options: { include_usage: true },
        tools:
          tools.length > 0
            ? tools.map((t) => ({
                type: "function" as const,
                function: {
                  name: t.name,
                  description: t.description,
                  parameters: t.parameters,
                },
              }))
            : undefined,
      });

      let text = "";
      const calls: {id: string; name: string; args: string}[] = [];
      let usage = { input: 0, output: 0 };
      let stopReason: StopReason = "stop";

      for await (const event of stream) {
        const choice = event.choices[0];

        if (choice?.delta?.content) {
          text += choice.delta.content;
          yield { type: "text_delta", delta: choice.delta.content };
        }

        for (const tC of choice?.delta?.tool_calls ?? []) {
          calls[tC.index] ??= { id: tC.id ?? `call_${tC.index}`, name: tC.function?.name ?? "", args: "" };
          //@ts-ignore
          calls[tC.index].args += tC.function?.arguments ?? "";
        }

        if (choice?.finish_reason === "tool_calls") stopReason = "toolUse";
        if (choice?.finish_reason === "length") stopReason = "length";
        if (event.usage) usage = { input: event.usage.prompt_tokens, output: event.usage.completion_tokens };
      }
      
      const content: ContentBlock[] = text ? [{type: "text", text}] : [];

      for (const call of calls) {
        if(call) content.push({type: "toolCall", id: call.id, name: call.name, arguments: JSON.parse(call.args)});
      }
      
      if(content.some((block) => block.type === "toolCall")) stopReason = "toolUse";
      yield {
        type: "done",
        message: {
          role: "assistant",
          content,
          usage,
          stopReason,
        },
      };
    },
  };
}
