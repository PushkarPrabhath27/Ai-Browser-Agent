# ADR-0001 — Monorepo with npm workspaces

- Status: Accepted (Phase 1)
- Date: 2025-01

## Context

We have six architectural subsystems (Reasoning, Perception, Executor, Verifier, Orchestrator, Trace) plus a server, widget, viewer, eval harness, fixture site, and demo host — twelve packages and one app. Tightly co-evolving contracts in early development. Single developer. Need minimal infra surface; any build-system complexity must pay for itself in saved time.

## Decision

Monorepo layout using npm workspaces. No Nx, no Turborepo, no Lerna, no custom orchestration.

## Alternatives considered

- **Polyrepo**: rejected. Premature versioning, multiple `package.json`s, separate CI for each. Violates the simplicity constraint; the project's thesis is fault-tolerance, not ops multiplexity.
- **Nx monorepo**: rejected at this scale. Adds dependency graph tooling, code generators, and a parallel executor we don't need. The package count (~12) is below the threshold where Nx's overhead pays for itself.
- **Turborepo**: rejected for the same reason. Excellent tool, but its wins are remote caching and task-graph parallelism — both unused at this scale. Migration later is friction-free because workspaces layout is Turborepo-compatible.
- **Bun workspaces**: rejected. Bun's workspace implementation is younger and smaller ecosystem; mixing Bun runtime with npm-published adapters adds an unsupported matrix.

## Consequences

- `npm install` resolves all 12 workspaces in one pass.
- Dependency boundaries between packages are enforced by `dependency-cruiser` (see NFR8 in the spec) — without this, "folders end up matching the architecture" is just convention.
- No remote build caching → CI installs from scratch every run. Acceptable given small workspace size; revisit if a phase starts hitting install timeouts.
- A future migration to Turborepo (or pnpm workspaces) requires no folder restructuring, only swap of the install/build orchestration script.

## Compliance

- MADR template (Context / Decision / Alternatives / Consequences).
- One ADR per non-trivial decision, per spec §0.3.5.
