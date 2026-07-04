# `@eai/reasoning`

Provider-agnostic reasoning interface (`decomposeGoal`, `decideNextAction`). Adapters for Gemini, Groq, Claude, OpenAI, Ollama (opt-in), Nvidia NIM. `FixtureReplayProvider` for cassettes and `ScriptedFakeProvider` for zero-network deterministic tests. Versioned prompt templates. One-shot malformed-output repair loop.

## Explicitly does NOT own

Browser state capture. Browser mutation. Verification. Control flow. The model is a tool here, not a driver; the Orchestrator controls when it is called.

## Dependencies

depends on `@eai/core` only.

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
