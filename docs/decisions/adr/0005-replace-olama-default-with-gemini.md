# ADR-0005 — Default reasoning provider: Gemini (cloud) instead of Ollama (local)

- Status: Accepted (Phase 1; amended from spec §0 / Phase 6 default)
- Date: 2025-01

## Context

The original spec lists Ollama as the default `REASONING_PROVIDER` for runtime use, justified as "fully free, self-hosted, deterministic-enough at temp=0, no network dependency." Gemini is listed as the cloud demo default.

This collides with the same laptop-disk constraint that drove ADR-0003: Ollama's model weights are 4–8GB per Llama/Mistral-class model. The contributor's machine cannot host them persistently. Local LLM execution is therefore not the v1 default path; it remains a verified adapter for self-hosting users with the disk budget.

The spec's _unit/integration/contract testing_ strategy was already independent of any provider — it uses `ScriptedFakeProvider` and `FixtureReplayProvider` ("cassettes"). That part of the design needs no change.

## Decision

- `REASONING_PROVIDER` enum remains: `scripted-fake | fixture-replay | gemini | groq | claude | openai | ollama | nvidia-nim`.
- **Default for live runtime and Phase 9 eval**: `gemini` (Google AI Studio free tier, Gemini 1.5 Flash by default).
- **Default for all unit/integration/contract tests**: `scripted-fake`, never `gemini`. This was already the spec's mandate and is unchanged.
- **Ollama adapter**: implemented in Phase 6 for completeness and to demonstrate the provider-swap interface actually works (per spec Phase 6 §"Acceptance Criteria: Switching REASONING_PROVIDER requires zero code changes anywhere outside `reasoning`'s own config loading"). Marked opt-in. Documented in `.env.example` as "requires local compute + several GB free; not used by default or by CI".
- **Groq adapter**: implemented alongside Gemini because Groq is OpenAI-compatible, fast, and free-tiered. Provides a "speed vs. quality" pairing useful in the eval report and for interviewers.
- **Nvidia NIM adapter**: implemented if a clean OpenAI-compatible base URL is configured. Lower priority; not blocking.
- **Claude / OpenAI**: implemented per spec.

## Alternatives considered

- **Keep Ollama as default**: rejected on disk/footprint grounds (see ADR-0003).
- **Make Gemini the only cloud adapter and drop Claude/OpenAI**: rejected. The provider-swap interface is part of the project's interview-defensibility narrative — "you can swap the model with an env var, no code change." Skipping adapters undermines that proof.
- **Hard-require one cloud provider with no opt-out**: rejected. Spec mandates provider-swap; we implement all of them.

## Consequences

- `.env.example` lists every provider env-var default; only one needs a real key for live operation.
- CI never makes a network call to a reasoning provider (already mandated by testing strategy; unchanged).
- The Phase 9 eval harness runs against Gemini by default but can be invoked against any provider via `npm run eval -- --provider=groq` etc., making the eval report directly comparable across providers without code change.
- The spec's "default demo" intent (Gemini) is honored; the "default local" intent (Ollama) is preserved as an opt-in adapter, not a default.
- README (Phase 11) will document the constraint and why the runbook is `gemini` not `ollama`.

## Compliance

- All providers are wired in `packages/reasoning` (Phase 6) and switch via env var alone.
- No test path in the repo (CI or local) ever invokes Ollama or downloads model weights during the default flow.
