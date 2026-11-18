import {runAgentLoop} from "./agent/loop";
import { tools } from "./tools/index.ts";
import { program } from 'commander';
import type { AssistantMessage, Message } from "./types.ts";
import { getProvider } from "./providers/index.ts";

interface InputArgs {
    prompt: string,
    provider?: string,
    model?: string,
}

program
.name('otto')
.description('A minimal terminal harness for your agents')
.version('0.1.0')
.option('-p, --prompt <prompt>', 'prompt string to process')
.option('--provider <provider>', 'default flm open ai comptabile no sign up')
.option('-m','--model <model-name>', 'Google: gemini-3.6-flash etc & auto by default flm open ai comptabile')
.action(async (args:InputArgs) => {

    if (!args.prompt) {
     console.error(`Otto needs a prompt to help you!`);
     process.exit(1);
    }

    try {   
        const provider = args.provider === "flm-openai" ? getProvider("flm-openai") : getProvider("google");
        const model = args.model ?? provider.defaultModel;
        const messages: Message[] = [{ role: "user", content: args.prompt }];

        await runAgentLoop({
        provider,
        model,
        tools,
        messages,
        onEvent(event) {
            if (event.type === "text") process.stdout.write(event.delta);
            else if (event.type === "tool_start") console.log(`\n ${event.call.name}`);
            else if (event.type === "tool_end") {
            const lines = event.result.split("\n").length;
            console.log(`\n ${event.isError ? event.result : lines}`);
            } else if (event.type === "turn_end") {
            const { usage, stopReason } = event.message;
            console.log(
                `\n\n  ${provider.name}(${model}): I/P Tokens: ${usage.input} | O/P Tokens: ${usage.output} | ${stopReason}`,
            );
            }
        },
        });
    }catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }   
})

program.parse();

