# `@eai/widget`

Embeddable Preact SDK. Goal input + start button, live step feed, live screenshot pane, approval modal, terminal status banner. State driven purely by SSE events — no client-side polling, no duplicated business logic.

## Explicitly does NOT own

Any HTTP transport (handed off to host page integration). Any policy decisions. The widget reflects Orchestrator's state; it does not own it.

## Dependencies

depends on `@eai/core` only (types-only via the published typings; integration is via HTTP/SSE at runtime).

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
