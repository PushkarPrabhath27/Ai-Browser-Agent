# `@eai/eval`

Versioned benchmark (~20 tasks) against the fixture site. CLI runner that executes each task via the real Orchestrator against a configurable `REASONING_PROVIDER`. Produces JSON + markdown report. No web surface.

## Explicitly does NOT own

Any UI. Any HTTP transport. Mocks of any subsystem — the eval harness must reuse the full real stack unmodified.

## Dependencies

depends on `@eai/orchestrator`, `@eai/core`, `@eai/fixture-site`. Must never depend on `@eai/server`.

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
