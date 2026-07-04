# Embeddable AI Web Agent

> **Phase 1 in progress.** This README is a placeholder. The vision content, architecture diagram, quickstart, and demo GIFs are intentionally deferred to Phase 11 (Hardening & Documentation). Phase 11 is responsible for the user-facing README so that the description matches the as-built system with zero aspirational claims about unbuilt features.

## Current state

- Repo bootstrap (Phase 1) complete.
- 12 packages + 1 app scaffolded as npm workspaces.
- Architectural module boundaries enforced by `.dependency-cruiser.cjs` (NFR8).
- Strict TypeScript, ESLint flat config, Prettier, commitlint, Husky pre-push.
- Full architectural spec preserved verbatim at `docs/architecture/original-spec.md`.

## Contributing

See `docs/architecture/overview.md` (stub in Phase 1; lands in Phase 7/8) and the per-package `README.md` files for what each subsystem owns and explicitly does NOT own.
