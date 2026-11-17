# otto

just a terminal agent.

A minimal terminal harness for your agents. No MCP, no sub-agents — spawn more ottos instead. No permissions → container. No plan / todos.

## Development

- `bun run format` — formats the project with Biome
- `bun run lint` — runs Biome's linter
- `bun run check` — checks formatting, lint rules, and import organization

## Design

### Interfaces

- `otto` — TUI
- `otto -o` — run once (as CLI)
- `otto --mode json` and `--mode rpc` — later

### Commands

- `/login` — Google and OpenAI, with API key
- `/model` — list models
- `/fork` — fork the session

### Agent loop

1. Reply without tools
2. If tools are needed → check if allowed → run tools (`read`, `write`, `edit`, `bash`)
3. Write session as a tree (one JSONL, `/fork`, `/tree`)

### Context

After interaction → feed the context → update the context (`AGENT.md`, prompt + session + system prompt → plain JSON, forkable).

## TODO

- [ ] TUI interface
- [ ] `otto -o` run-once CLI mode
- [ ] `/login` command (Google + OpenAI, API key)
- [ ] `/model` command — list models
- [ ] Agent loop with tool gating (`read`, `write`, `edit`, `bash`)
- [ ] Session as a tree (single JSONL, `/fork`, `/tree`)
- [ ] Context updates (`AGENT.md`, plain JSON, forkable)
- [ ] `--mode json` / `--mode rpc` output modes
