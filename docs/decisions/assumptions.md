# Assumptions Log

Per the spec's Operating Model (§"Where this document is silent, Hermes Agent must make the most conservative choice consistent with the architecture principles in this document, record the assumption explicitly, and continue — it must never block on clarification for a decision it can reasonably infer from the principles stated here").

Each entry: timestamp-free, conservative-choice, reasoning, the spec principle it preserves.

---

## Phase 1 — Repository Bootstrap

### A1.1 — Use TypeScript branding pattern with phantom IDs

- **Assumption**: `Brand<K, T> = K & { readonly __brand: T }` is the right nominal-typing helper, applied to `TaskId`, `SnapshotId`, `EventId` initially.
- **Reasoning**: Spec mandates "every public function has an explicit input/output type; no implicit any" (§Coding Standards phase 1). Stringly-typed IDs across subsystem boundaries violate that constraint and are an empirically common bug class in agent systems. Branding gives a compile-time guarantee with zero runtime overhead.
- **Preserves**: NFR9 (testability), the architecture review's "types are contracts not hints" thesis.

### A1.2 — Install only Chromium for Playwright; do not install Firefox or WebKit

- **Assumption**: `npx playwright install chromium` (single browser) suffices for the entire project's scope.
- **Reasoning**: Spec Phases 3–10 reference a single rendering engine; the spec's out-of-scope list explicitly excludes multi-engine coverage. Footprint saved by skipping Firefox/WebKit is ~500MB-1GB combined. A test asserting against Chromium-only is sufficient.
- **Preserves**: Simplicity constraint, footprint NFR-driven amendment (ADR-0003).

### A1.3 — Workspace package identity is `@eai/<name>`

- **Assumption**: Use `@eai/` scope for all internal packages (e.g., `@eai/core`, `@eai/perception`).
- **Reasoning**: npm scopes are the idiomatic way to namespace internal packages without publishing to a registry. `@eai` consolidates to one namespace; not committing to a package-name registry ahead of any public release preserves flexibility.
- **Preserves**: Future publishing optionality; SHARP-NAMED package boundaries prevent `npm install core` collisions.

### A1.4 — Each package exports exactly one `index.ts` public surface

- **Assumption**: Even in Phase 1 (essentially empty packages), each exports a typed marker via `index.ts`. Sub-packages gain an `internal/` subfolder for non-public helpers as needed in later phases.
- **Reasoning**: Spec §Coding Standards phase 1 mandates this. Pre-committing to it in Phase 1 prevents the "we'll tidy this later" debt that never gets paid.
- **Preserves**: Public-surface stability for downstream packages.

### A1.5 — `dev` script uses `concurrently` at the root, not per-package orchestration

- **Assumption**: Root `npm run dev` orchestrates workspace-level processes; individual packages expose a `dev` script sufficient for their own boot.
- **Reasoning**: One-command developer experience is what differentiates "monorepo" from "pile of folders." Per-package orchestration forces DevOps overhead onto every contributor.
- **Preserves**: SC4 (single-command local operation), simplicity constraint.

### A1.6 — Strict TypeScript project references in a single root `tsconfig.json`

- **Assumption**: Use TypeScript project references (composite mode) for the cross-package build graph; one root `tsconfig.json` references all packages.
- **Reasoning**: Project references preserve incremental build across packages and let one `tsc --build` from root rebuild the DAG. Simpler than per-package scripts orchestrating `tsc`.
- **Preserves**: NFR7 (portability), deterministic builds.

### A1.7 — No `index.ts` re-exporting of arbitrary files inside a package

- **Assumption**: `index.ts` re-exports only the public surface (currently the marker and the brand helpers in `core`); everything else stays under `internal/`, `__tests__/`, etc.
- **Reasoning**: Spec §Coding Standards: "every subsystem package exports exactly one public interface module (`index.ts`) — internals are not importable from outside the package." Pre-committing in Phase 1 prevents later "I'll just add one more export" erosion.
- **Preserves**: Encapsulation, dependency-cruiser-level reasoning over packages.

### A1.8 — Husky pre-push (not pre-commit)

- **Assumption**: Enforce commitlint at pre-push only, not pre-commit.
- **Reasoning**: Pre-commit is too aggressive for WIP commits (validating in-progress work that may be amended), and tends to be disabled at scale. Pre-push catches the bad message before it leaves the workstation, without slowing the inner loop.
- **Preserves**: Developer ergonomics + spec's commitlint enforcement intent.

### A1.9 — No telemetry / analytics SaaS of any kind

- **Assumption**: No third-party analytics or telemetry SDK (no Sentry, no LogRocket, no PostHog, no Google Analytics).
- **Reasoning**: Per project owner's explicit scope addition in Phase 1 conversation; anonymous data leaving the local machine violates the "self-hostable, embeddable" thesis.
- **Preserves**: SC4 (zero mandatory paid dependency + self-hosting), privacy-by-default.

### A1.10 — ESLint v9 flat config (`.js`, not `.eslintrc.cjs`)

- **Assumption**: Install ESLint v9 and write `eslint.config.js` (flat config).
- **Reasoning**: ESLint v9 deprecated the `.eslintrc.*` family; defaulting to v9 means no forced migration inside the project's own lifetime. The Phase 1 plan correctly checked `--version` post-install before writing the file.
- **Preserves**: Forward compatibility, "use current non-deprecated formats" rule (project owner's correction C1).
