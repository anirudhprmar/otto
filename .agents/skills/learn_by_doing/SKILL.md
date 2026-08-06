---
name: learn_by_doing
description: >
  When the user wants to build or implement something themselves — whether to learn
  a new concept or to actively participate in building a feature — use the
  "learn by doing" method: scaffold a checkpoint guide directly inside the target
  source file rather than writing the implementation for them. Triggered when the
  user says things like "teach me", "help me learn", "go step by step",
  "don't write the code", "I want to understand", "make checkpoints for me",
  "walk me through implementing this", or "I want to build this myself".
---

# Learn By Doing — Skill Instructions

## When This Skill Applies

Activate this skill when the user signals they want to **do the work themselves**,
whether the motivation is learning a concept *or* actively participating in
building a feature. Both cases use the same method.

Common signals:

- "don't write the code yet / for me"
- "give me steps and resources"
- "make checkpoints for me"
- "I want to learn this"
- "walk me through it"
- "teach me as we go"
- "I want to implement this myself"
- "help me build this step by step"
- "let me try this"

The distinction between "learning" and "building" doesn't change the method —
in both cases the user wants to be the one writing code, with you as a guide.

---

## Core Method: Checkpoint Files

Instead of implementing the code, **scaffold the target file with a structured
checkpoint guide as comments**. The user fills in the actual code between the
checkpoints. You play the role of a patient teacher who explains, hints, and
checks — but never gives away the answer until asked.

### Checkpoint Structure

Every checkpoint must include all four of these tags:

```
// [LEARN]  — The concept to understand before writing. Link to official docs.
// [TODO]   — Exactly what the user needs to write (described, not written).
// [HINT]   — A nudge toward the answer. Tell users not to peek until they've tried.
// [CHECK]  — A concrete, runnable way to verify they got it right.
```

### File Layout

```
// Top: Brief explanation of what the file does and how to use the guide
// Then: Numbered checkpoints in logical, dependency order
// Each checkpoint: [LEARN] → [TODO] → [HINT] → [CHECK]
// Existing code (imports, stubs): written out — scaffolding is fine
// Actual logic: left as commented-out hints or TODO markers, never filled in
```

---

## Rules for Writing Checkpoints

1. **Order matters** — later checkpoints depend on earlier ones. Sequence them
   so the user can run `cargo check` / `npm run build` / equivalent after each one.

2. **Link to primary sources** — always link the official docs, not tutorials:
   - Rust: `https://docs.rs/<crate>` or `https://doc.rust-lang.org/std/...`
   - Node/TS: `https://nodejs.org/api/` or the package's own docs site
   - Never link random blog posts as the primary resource.

3. **Hints must not give it away** — a hint should reduce the search space by
   ~50%, not hand the user the answer. A good hint points to the right type,
   method name, or concept — not the full expression.

4. **Checks must be runnable** — every [CHECK] should describe something the
   user can observe: a compiler passing, a print statement output, or a manual
   test they can perform.

5. **Never write logic code** — you may write:
   - `use` / `import` statements as scaffolding
   - Type annotations and struct definitions
   - Empty function/method stubs (`{ todo!() }`)
   - Comments and doc links
   
   You must NOT write:
   - Function bodies with real logic
   - Algorithm implementations
   - Any code that makes a checkpoint "done" for the user

6. **Explain the "why"** — each [LEARN] section should explain *why* this
   concept is needed here, not just what it is. Connect it to the problem
   being solved.

---

## When the User Gets Stuck

If the user asks for help at a specific checkpoint:

1. **Ask what they tried first** — "What did you write? What error are you seeing?"
2. **Diagnose the specific misunderstanding** — don't re-explain the whole concept.
3. **Give a targeted nudge** — point to the specific doc section, method name,
   or concept that unblocks them.
4. **If they've genuinely tried and are still blocked** — you may show a
   corrected version of *just that checkpoint*, with an explanation of why
   their attempt didn't work.

When explaining a compile error:
- Quote the error message
- Identify which line/concept is wrong
- Explain what Rust/the compiler expected vs. what it got
- Tell the user how to fix it without writing the fix for them

Example from this conversation:
> User: "at checkpoint 3 how do i go about writing the function, idk where to start"
> 
> Good response: Identify two specific issues (wrong import path, empty body),
> explain *why* each is an error, show what the correct form looks like as a
> skeleton, and tell them to run cargo check again.

---

## Example Checkpoint (Rust, arboard clipboard)

```rust
// =============================================================================
// CHECKPOINT 5 — Save the current clipboard contents
// =============================================================================
//
// [LEARN] `arboard::Clipboard::new()` opens a handle to the system clipboard.
//         `.get_text()` returns Result<String, arboard::Error>.
//         We call `.ok()` to turn it into Option<String> — None if it fails
//         (e.g. clipboard is empty or holds an image).
//
//         Read: https://docs.rs/arboard/latest/arboard/struct.Clipboard.html
//
// [TODO]  Create a Clipboard, call get_text().ok(), store as `saved: Option<String>`
//
// [HINT]  Use a block `{ }` to scope the clipboard handle — arboard requires
//         you not hold the handle open while doing other things with it.
//
// [CHECK] Print `saved` — it should show whatever is currently on your clipboard.
```

---

## Escalation: When to Write the Code

Only write implementation code when the user **explicitly asks** you to take
over. Phrases that signal this:

- "just write it for me"
- "go ahead and implement it"
- "I give up, show me"
- "let's move on" (after being stuck for a while)

When you do write code after a learning session, briefly explain the key parts
so the session still had educational value.

---

## Meta: Updating This Skill

If the user refines this method — e.g. asks for a different tag format, wants
code in hints, or prefers a different check style — update this SKILL.md to
reflect the new preference so future sessions use it automatically.
