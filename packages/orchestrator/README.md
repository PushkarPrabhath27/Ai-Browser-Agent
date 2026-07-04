# `@eai/orchestrator`

The control loop. Owns the policy decision function (`decidePolicy`), all budgets, the task lifecycle state machine, and the approval-wait mechanism. The single failure-handling code path through `decidePolicy`.

## Explicitly does NOT own

HTTP. UI. Browser mechanics. It delegates everything; it owns sequencing.

## Dependencies

depends on every subsystem package (`@eai/core`, `@eai/trace`, `@eai/perception`, `@eai/executor`, `@eai/verifier`, `@eai/reasoning`). **Must never depend on `@eai/server`** (server depends on it, not vice versa).

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
