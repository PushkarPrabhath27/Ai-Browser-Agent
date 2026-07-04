# `@eai/trace-viewer`

Standalone read-only SPA for step-by-step replay of any recorded task. Components: `PlanPanel`, `StepCard` (screenshot pair + rationale + verdict + policy decision), `OutcomeSummary`. Click-to-expand full raw event payload. Filter by subsystem or event type.

## Explicitly does NOT own

Re-running anything. Calling any model. Any server-side logic.

## Dependencies

depends on `@eai/core`; calls the server over HTTP at runtime to fetch traces.

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
