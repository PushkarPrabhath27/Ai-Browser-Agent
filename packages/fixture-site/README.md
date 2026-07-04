# `@eai/fixture-site`

Self-hosted deterministic test sandbox: `/login`, `/search`, `/catalog`, `/product/:id`, `/cart`, `/checkout`, `/wizard`, `/unstable`. Plain server-rendered (no SPA framework) so it's view-source-inspectable.

## Explicitly does NOT own

Any agent, any model, any orchestrator. The fixture site is a leaf — it knows nothing of the system being tested against it.

## Dependencies

depends on nothing internal.

## Phase 1 state

This package ships its typed package marker only. Real logic lands in the spec-defined phase for this subsystem (see `docs/architecture/original-spec.md`).

If you find yourself wiring business logic here before its owning phase lands, that's scope drift. Stop, log the deferral in `.hermes/PROGRESS.md` and `docs/decisions/backlog-out-of-scope.md`, and move on.

## Compliance

- Single public surface: `src/index.ts`.
- Package boundary enforced by `.dependency-cruiser.cjs` at the repo root.
- No `console.log` in library code — use a structured logger.
