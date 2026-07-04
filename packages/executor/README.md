# `@eai/executor`

Execution of exactly one resolved action. The safety gate chokepoint — domain allowlist enforcement and sensitive-action detection. Mechanical-only: this tells you the click landed, not whether it was the right click.

## Explicitly does NOT own

Anything semantic. Any retry logic. Any state interpretation. Verification of intent satisfaction.

## Dependencies

depends on `@eai/core` only.

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
