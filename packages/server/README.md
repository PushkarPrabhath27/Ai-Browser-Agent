# `@eai/server`

Fastify HTTP/SSE boundary. Wires config to `SafetyPolicy` and to `Orchestrator`. Rate-limiting. Static hosting of built widget/viewer/demo-host assets. Per-task Playwright browser-context lifecycle management.

## Explicitly does NOT own

Any control-loop logic. Any verification. Any reasoning. All of that belongs in `@eai/orchestrator`.

## Dependencies

depends on `@eai/orchestrator`, `@eai/trace`, `@eai/core`. Must never depend on `@eai/widget`.

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
