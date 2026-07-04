# `@eai/trace`

Append-only persistence (SQLite via Prisma) and ordered query-by-task for every trace event. The recorder; nothing more.

## Explicitly does NOT own

Any policy. Any decision. Any browser interaction. Trace stores facts; it does not interpret them.

## Dependencies

depends on `@eai/core` (for Zod schemas + branded IDs).

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
