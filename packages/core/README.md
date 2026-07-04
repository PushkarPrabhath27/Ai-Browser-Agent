# `@eai/core`

> The only package in the monorepo with zero internal dependencies.

## Owns

- Branded ID types: `TaskId`, `SnapshotId`, `EventId`.
- The error taxonomy (Phase 2+) that every other package imports.
- The canonical action vocabulary, perception snapshot shape, plan/intent shape, verification result shape, trace event shape, safety policy shape (Phase 2+).
- A single public surface: `src/index.ts`. Internal helpers live under `src/internal/` (when introduced in later phases) and are not re-exported.

## Explicitly does NOT own

- Any persistence (→ `@eai/trace`).
- Any browser or DOM interaction (→ `@eai/perception`).
- Any mutation of browser state (→ `@eai/executor`).
- Any reasoning model coupling (→ `@eai/reasoning`).
- Any verification logic (→ `@eai/verifier`).
- Any control-flow decisions (→ `@eai/orchestrator`).
- HTTP, SSE, or any transport concern (→ `@eai/server`).

## Phase 1 state

This package ships only the branded-ID primitives + a typed package marker. The full contract schemas (Action vocabulary, Zod schemas, TraceEvent shape, etc.) land in Phase 2 per the binding spec.

If you are looking at this package and feel "this should also contain X," you are likely describing a Phase 2 deliverable. Do not pre-write it here — drift risk is real and the spec is explicit.

## Compliance

- No imports from any other `@eai/*` package. Enforced by `.dependency-cruiser.cjs`.
- Only exports through `src/index.ts`. Enforced by the test in `src/__tests__/marker.test.ts`.
