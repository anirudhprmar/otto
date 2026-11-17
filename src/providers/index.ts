import { type Provider } from "../types.ts";
import { createGoogle } from "./google.ts";
import { createFlmOpenAICompat } from "./openai-flm-compat.ts";

const providers:Record<string, ()=>Provider> = {
    "google":()=>createGoogle("google", process.env.GOOGLE_API_KEY! as string, "gemini-3.6-flash"),
    "flm-openai":()=>createFlmOpenAICompat("flm-openai", "https://flm.stonech.at/v1",process.env.FLM_API_KEY!,"auto"),
}

export function getProvider(name:string): Provider {
    const create = providers[name];
    if(!create) throw new Error(`Provider ${name} not found`);
    return create();
}