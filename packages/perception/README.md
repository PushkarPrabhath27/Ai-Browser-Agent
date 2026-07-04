# `@eai/perception`

Live browser state → `PerceptionSnapshot`. Resolves a snapshot's `ref` to a Playwright locator. Element-indexing algorithm over the accessibility tree, with visibility filtering and bounded truncation.

## Explicitly does NOT own

Any mutation of browser state. Any reasoning coupling. Any retry policy. Any safety gate. Verifying that an action succeeded.

## Dependencies

depends on `@eai/core` only.

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
