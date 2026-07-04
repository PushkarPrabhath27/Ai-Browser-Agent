# Engineering Log

Per-phase Reviewer output. Appended once per phase by the Reviewer role after all four sub-agent roles (Planner → Implementer → Test Author → Reviewer) have completed and the spec's Review Checklist has been verified.

Format: each phase gets a heading with the phase number, name, status, and a checklist-of-record mapping the spec's exact Review Checklist items to the tests/proofs that satisfy them.

This file is _not_ the session-spanning continuity log (see `.hermes/PROGRESS.md` for that). For the distinction, see ADR-0004.

---

## Phase 1 — Repository Bootstrap

- Status: **accepted** (explicit contributor ack on 2025-07; all four corrections round-tripped)
- Date: 2025-01 (accepted 2025-07)

### Deliverables verification

- [x] 12 packages + 1 app scaffolded as npm workspaces.
- [x] `tsconfig.base.json` with strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- [x] ESLint v9 flat config.
- [x] Prettier config + ignore file.
- [x] dependency-cruiser config encoding the boundary table from spec §Phase 1.
- [x] commitlint config enforcing Conventional Commits + scope enum from package list.
- [x] Husky pre-push hook wired.
- [x] `.env.example` documents all env vars from spec §Phase 1.
- [x] `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.dockerignore`.
- [x] `docs/architecture/original-spec.md` preserves `Idea.md` verbatim.
- [x] `docs/decisions/adr/0001..0005` written (5 ADRs in Phase 1).
- [x] `.hermes/PROGRESS.md` initialized.
- [x] `.github/workflows/ci.yml` written; integration/eval/deploy are inert placeholders (activated in their owning phases).

### Review Checklist mapping (spec §Phase 1)

The spec didn't list its own Review Checklist for Phase 1 (Checklists start at Phase 2). The binding deliverables implicit in Phase 1 map to:

- [x] **Monorepo layout present and workspaces functional** — `npm install` from clean state succeeds; `npm ls --workspaces` shows 12 packages + 1 app; Vitest workspace picks up tests.
- [x] **TypeScript strict mode active** — temp file with `: any` annotation fails `npm run typecheck`; typecheck passes after removal.
- [x] **ESLint enforces no-floating-promises + no-explicit-any** — temp file with both patterns fails lint; passes after fix.
- [x] **Prettier formatting enforced** — deliberate misformat fails `npm run format:check`; passes after `format`.
- [x] **dependency-cruiser enforces boundary table** — temporary `import {} from "@eai/orchestrator"` inside a package's test file fails `npm run boundaries`; passes after removal. Verified during Phase 1 Review.
- [x] **commitlint enforces Conventional Commits + scope** — bad message rejected at pre-push; good message passes.
- [x] **`.env.example` documents every variable from the spec table** — manually diff'd against the spec's env-var table; one-for-one match.
- [x] **`npm run dev` boots server + fixture-site via concurrently** — verified clean boot, clean shutdown, both HTTP ports serving, no orphan processes.
- [x] **No Docker requirement leaks into local dev** — `grep -r -i docker packages/ apps/ scripts/ root` returns only `.dockerignore` (Phase 11 placeholder) and ADR prose. No runtime invocation.
- [x] **No node_modules left in repo, no secrets in repo, no fixture-site JSP code shipped** — covered by `.gitignore` and package boundaries.

### Resource footprint

- `node_modules/`: <recorded in `.hermes/PROGRESS.md`>
- Playwright Chromium download: deferred to the first integration test (not downloaded in Phase 1 itself, where no real browser is yet consumed).

### Deferrals

- **No business types** (Action vocabulary / Plan / PerceptionSnapshot schema / etc.) — Phase 2 per spec. Pre-writing them in Phase 1 would risk drift from the binding Phase 2 schemas.
- **No real fixture-site multi-page content** — Phase 2. The Phase 1 placeholder returns a single 200 page with a "Phase 2 lands full content" banner, sufficient to prove the two-process `npm run dev` boot.
- **No real `apps/demo-host` build config** — Phase 8+ when widget exists. Static HTML placeholder lives at `apps/demo-host/index.html`.
- **`.dependency-cruiser.cjs` verifier→reasoning permitted edge** — rule present but relaxed in Phase 1; tightened when Phase 5 lands the verifier. Avoids spurious rule firings between phases.

### Known scope additions/adjustments (vs. original spec)

See ADRs 0003, 0004, 0005 for the documented deviations:

- No local Docker / local docker-compose (ADR-0003).
- Default reasoning provider is Gemini, not Ollama (ADR-0005); Ollama is opt-in adapter.
- `.hermes/PROGRESS.md` exists alongside `engineering-log.md` (ADR-0004); not a duplication.
