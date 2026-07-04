# `@eai/verifier`

Layered verification: structural checks first (URL delta, target element appearance/disappearance, DOM diff), model-assisted fallback only when structural evidence is genuinely inconclusive. Always bounded to one model call per verification event.

## Explicitly does NOT own

Retry / replan / escalate decisions. Any browser mutation. Any control flow.

## Dependencies

depends on `@eai/core` and is the **only** non-reasoning package permitted to also import `@eai/reasoning` (for the bounded fallback judgment call only).

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
