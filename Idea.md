# Embeddable AI Web Agent — Engineering Specification for Hermes Agent

**Document status:** Authoritative implementation specification. Hermes Agent implements against this document. Where this document is silent, Hermes Agent must make the most conservative choice consistent with the architecture principles in this document, record the assumption explicitly in `docs/decisions/assumptions.md`, and continue — it must never block on clarification for a decision it can reasonably infer from the principles stated here.

**Architectural thesis (do not violate):**

> The reasoning engine is an unreliable, non-deterministic dependency. Every other subsystem exists to contain, verify, recover from, or explain its behavior. Any proposed change that increases coupling to the reasoning engine, or that makes another subsystem's correctness depend on the model being right, is rejected by default.

---

# PART 0 — OPERATING MODEL FOR HERMES AGENT

This section defines _how_ Hermes Agent should work, not what it should build. It exists because a solo autonomous build effort fails most often from **scope drift, silent placeholder code, and undocumented assumptions** — not from lack of capability. This section is a control system for the build process itself, deliberately mirroring the plan → act → verify discipline used in the product architecture. Dogfooding the philosophy of the product in the process that builds it is intentional and should be called out in the README as such.

## 0.1 Role decomposition (sub-agent roles)

Hermes Agent should decompose its own work into four internal roles per phase, executed in this order, never skipped:

| Role                    | Responsibility                                                                                                                                                                | Forbidden from doing                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Planner**             | Reads the phase spec, produces a concrete task checklist, identifies ambiguities, writes conservative resolutions to `docs/decisions/assumptions.md`                          | Writing implementation code                                          |
| **Implementer**         | Writes production code strictly against the interfaces/schemas frozen in `packages/core`                                                                                      | Inventing new cross-package interfaces without updating `core` first |
| **Test Author**         | Writes unit/integration/contract tests derived directly from the phase's _Acceptance Criteria_ and _Review Checklist_ — adversarially, trying to break the Implementer's work | Weakening a test to make it pass                                     |
| **Reviewer/Integrator** | Runs lint, typecheck, dependency-boundary check, full test suite; verifies against the Review Checklist verbatim; blocks merge on any TODO/placeholder/unhandled-error path   | Approving its own unresolved TODOs                                   |

A phase is not complete until all four roles have run and the Reviewer has produced a clean report appended to `docs/decisions/engineering-log.md`.

## 0.2 Parallelization strategy (maximize efficiency)

Not all phases are sequential. Once `packages/core` (Phase 2) freezes the shared contracts (types, schemas, action vocabulary, trace event shape), four subsystems have **zero interdependency** on each other — only on `core` and on test doubles of their neighbors. Hermes Agent should treat this as an explicit fork/join point and assign independent sub-agent passes:

```
Phase 0 ── Phase 1 ── Phase 2 (core contracts + trace schema + fixture site)
                              │
              ┌───────────────┼───────────────┬───────────────┐
         Phase 3          Phase 4         Phase 5         Phase 6
        Perception        Executor        Verifier       Reasoning
              └───────────────┼───────────────┴───────────────┘
                              │  (hard sync point — all four required)
                        Phase 7 Orchestrator
                              │
                        Phase 8 Embeddability
                              │
                  ┌───────────┴───────────┐
             Phase 9 Eval           Phase 10 Trace Viewer
                  └───────────┬───────────┘
                        Phase 11 Hardening / Deploy
```

**Rule:** Phase 7 may not begin until Phases 3–6 have each independently passed their own Acceptance Criteria in isolation (tested against mocks of their neighbors, not against each other). This forces each subsystem to be correct on its own terms before integration — the same discipline the architecture review demanded of the design itself.

## 0.3 Anti-drift rules (mandatory, non-negotiable)

1. **No placeholder implementations.** If a function cannot be fully implemented in a phase, the feature it belongs to does not ship in that phase — it moves to the phase where its dependencies exist. Never commit a stub that returns fake data "to be replaced later."
2. **No silent scope expansion.** If Hermes Agent identifies a feature that would improve the system but is not listed in this document, it must be logged in `docs/decisions/backlog-out-of-scope.md` with a one-line justification for exclusion — not built.
3. **Every phase must leave the repository in a shippable state**: builds, boots, passes CI, deploys.
4. **Every architectural boundary in Part 5 of the prior review is enforced by static tooling** (dependency-cruiser rules, see Phase 1), not just by folder convention.
5. **Every non-trivial design decision gets an ADR** (`docs/decisions/adr/NNNN-title.md`): context, decision, alternatives considered, consequences. Target: 15–25 ADRs over the project lifetime. This is itself a deliverable — it is what makes the finished repository legible to a reviewer in an interview.

---

# PHASE 0 — FOUNDATION

## Product Vision

An open-source, self-hostable, embeddable software component that accepts a natural-language goal, autonomously operates a real web browser to accomplish it, and does so with the reliability discipline, safety gating, and explainability of a production distributed system — not a demo script. The project's contribution is not "an agent that browses the web" (many exist); it is **a rigorously engineered control system that makes an unreliable reasoning component safe and explainable to embed inside someone else's application.**

## Project Scope

**In scope:** single-agent, single-browser-context task execution; bounded-horizon tasks (minutes, tens of steps); accessibility-tree-based perception and grounding; structural + fallback model-assisted verification; a fixed, closed action vocabulary; human-in-the-loop approval gating for sensitive actions; full trace/replay explainability; an embeddable widget SDK; a reproducible evaluation harness against a self-hosted fixture site.

**Out of scope (explicit, permanent, and justified):** multi-agent orchestration, persistent cross-session memory/RAG, vision-first pixel grounding as a primary path, a general-purpose workflow/automation engine, enterprise features (billing, orgs, multi-tenant dashboards), horizontal scaling/queue infrastructure, mobile app automation, non-Chromium engines as a v1 requirement.

## Engineering Goals

Reliability → Explainability → Recoverability → Bounded determinism → Adaptability → Accuracy → Latency → Cost, in that priority order (see prior architecture review, Phase 1, for justification — unchanged here).

## Non-Goals

Maximizing task generalization across the open internet; maximizing model capability; building a SaaS; building a marketplace of agents; supporting concurrent multi-tenant scale.

## Success Criteria

- SC1: ≥ 85% task success rate on the internal ~20-task benchmark suite (Phase 9), tracked continuously in CI, with regressions blocking release.
- SC2: 100% of task runs produce a complete, replayable trace — no run is ever unexplainable.
- SC3: Zero sensitive/irreversible actions ever execute without an explicit approval event in the trace.
- SC4: The entire system runs locally via a single command, with zero mandatory paid dependency.
- SC5: A third-party page can embed the widget and start a task in under 10 lines of integration code.
- SC6: A new engineer can read `docs/architecture/overview.md` + ADRs and correctly explain the system's failure-handling behavior within 30 minutes, without reading source code.

## Functional Requirements

| ID   | Requirement                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| FR1  | Accept a natural-language goal + starting URL via the embeddability contract.                                    |
| FR2  | Decompose the goal into a coarse, revisable plan of intents.                                                     |
| FR3  | Execute plan intents step-by-step against a live browser session.                                                |
| FR4  | Ground each abstract action to exactly one concrete, executable DOM element.                                     |
| FR5  | Verify the effect of every executed action using structural evidence first, model judgment only as fallback.     |
| FR6  | Decide retry / re-decide / replan / escalate / abort based on verification outcome and explicit budgets.         |
| FR7  | Pause and require explicit human approval before any sensitive or irreversible action.                           |
| FR8  | Enforce a domain allowlist at the execution chokepoint; refuse out-of-policy navigation/actions unconditionally. |
| FR9  | Stream live step-by-step progress and periodic screenshots to the embedding host in real time.                   |
| FR10 | Persist a complete, queryable, replayable trace of every task.                                                   |
| FR11 | Provide a trace viewer capable of reconstructing any past run step-by-step.                                      |
| FR12 | Expose an embeddable widget usable by a third-party host page with a narrow integration surface.                 |
| FR13 | Support swapping the reasoning provider (cloud or local) via configuration, without code changes elsewhere.      |
| FR14 | Provide an automated evaluation harness producing reliability metrics against a fixed benchmark.                 |

## Non-Functional Requirements

| ID   | Requirement                                                                                                                                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR1 | Reliability: benchmark success rate tracked continuously; regressions below threshold fail CI.                                                                       |
| NFR2 | Explainability: every control-flow decision is recorded; no run requires re-execution to be explained.                                                               |
| NFR3 | Boundary determinism: Perception, Executor, and Verifier are deterministic given fixed input state; only the Reasoning Engine is non-deterministic.                  |
| NFR4 | Recoverability: no unhandled exception may crash the control loop; every failure path resolves to a defined terminal or escalation state.                            |
| NFR5 | Safety (defense in depth): the domain allowlist and sensitive-action gate are enforced inside the Executor itself, never only inside a prompt.                       |
| NFR6 | Bounded cost/latency: step count, retries, replans, wall-clock time, and model-call count are hard-capped; no adversarial model output can produce an infinite loop. |
| NFR7 | Portability: full local operation via one command; no mandatory paid service.                                                                                        |
| NFR8 | Maintainability: architectural module boundaries are enforced by static dependency analysis in CI, not convention alone.                                             |
| NFR9 | Testability: every subsystem is independently unit-testable without a live browser or live model call.                                                               |

## Architecture Overview (recap, technology-agnostic)

Six subsystems: **Reasoning Engine, Perception & Grounding Layer, Executor, Verifier, Orchestrator, Trace & Explainability Recorder.** Safety policy is a chokepoint inside Executor. Embeddability is the external contract boundary of Orchestrator. See Part 5/6 of the architecture review for full rationale — unchanged and binding here.

## Repository Structure (summary — full detail in Phase 1)

Monorepo, npm workspaces, one package per architectural subsystem, plus server, widget, viewer, eval, and fixture-site packages, plus a demo host app.

## Coding Standards (summary — full detail in Phase 1)

TypeScript strict mode everywhere; no implicit `any`; enforced unidirectional dependency graph matching the architecture diagram; functional core / imperative shell; every public function has an explicit input/output type; no console.log in library code (structured logger only); every subsystem package exports exactly one public interface module (`index.ts`) — internals are not importable from outside the package.

## Git Strategy

Trunk-based development on `main`, protected (CI must pass, no direct pushes). Every phase is delivered as one or more short-lived branches (`phase/03-perception`, etc.), merged via self-reviewed PR using the Phase's Review Checklist as the PR template. Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`) enforced by commit-lint in CI.

## Branch Strategy

`main` — always deployable. `phase/NN-name` — one per phase, deleted after merge. No long-lived `develop` branch (unnecessary indirection for a solo project — rejected under the simplicity constraint).

## Documentation Strategy

- `README.md` — vision, quickstart, architecture diagram, demo GIF/link.
- `docs/architecture/overview.md` — the six-subsystem model, written for a reader who has never seen the code.
- `docs/decisions/adr/` — one ADR per non-trivial decision.
- `docs/decisions/engineering-log.md` — running phase-by-phase log (Reviewer output appended per phase).
- `docs/decisions/assumptions.md` — every conservative assumption Hermes Agent made under ambiguity.
- Every package has its own `README.md` explaining its single responsibility and explicitly listing what it does _not_ own.

## Testing Strategy (summary — enforced per phase)

Five tiers: (1) unit tests per package with neighbors mocked, (2) contract/schema tests validating Zod-schema conformance at every subsystem boundary, (3) integration tests using a real browser + fixture site + a scripted deterministic fake reasoning provider, (4) end-to-end tests using a real (local or free-tier) LLM against the fixture site, (5) the evaluation harness as a standing regression benchmark. LLM calls in tiers 1–3 are never live — recorded request/response fixtures ("cassettes") are replayed for determinism and zero cost.

## Deployment Strategy

Single container image containing the API server (which embeds the browser automation runtime) and the statically built widget/trace-viewer/demo-host assets. Primary distribution: `docker compose up` for self-hosting. Secondary: one always-available hosted demo on a scale-to-zero free-tier platform, explicitly documented as "best-effort demo, self-host for full experience."

## CI/CD Strategy

GitHub Actions, four workflows: `ci.yml` (lint, typecheck, unit + contract tests, build — every push/PR), `integration.yml` (fixture-site + fake-provider integration tests — every push/PR), `eval.yml` (full benchmark against a real free-tier/local model — scheduled + manual dispatch, non-blocking but visibly reported), `deploy.yml` (build + publish image — manual dispatch only, to keep cloud spend at zero by default).

---

# PHASE 1 — REPOSITORY BOOTSTRAP

## Monorepo vs. Polyrepo Decision

**Decision: monorepo, npm workspaces.** Justification: the six subsystems have tight, frequently co-evolving contracts during early development (Phases 2–7); polyrepo would force premature versioning/publishing overhead for a solo developer, directly violating the simplicity constraint. npm workspaces chosen over Nx/Turborepo: the package count (~12) does not justify a build-caching/task-graph tool; plain workspaces plus root scripts is simpler, has zero extra config surface, and is well understood by any reviewer. Migration path: adopt Turborepo later without restructuring if build times ever become painful — workspaces layout is Turborepo-compatible.

## Full Folder Structure

```
embeddable-ai-web-agent/
├── package.json                      # root workspace manifest, shared scripts
├── tsconfig.base.json                # shared strict TS compiler options
├── .eslintrc.cjs
├── .prettierrc
├── .dependency-cruiser.cjs           # enforces subsystem boundary rules
├── .commitlintrc.cjs
├── .editorconfig
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── README.md
├── LICENSE                           # MIT
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── integration.yml
│       ├── eval.yml
│       └── deploy.yml
├── docs/
│   ├── architecture/
│   │   ├── overview.md
│   │   └── diagrams/
│   ├── decisions/
│   │   ├── adr/
│   │   ├── engineering-log.md
│   │   ├── assumptions.md
│   │   └── backlog-out-of-scope.md
│   └── prompts/
│       └── (versioned prompt templates, Phase 6+)
├── packages/
│   ├── core/                # shared types, Zod schemas, action vocabulary, trace event schema
│   ├── trace/                # trace recorder: write/query API over persisted storage
│   ├── perception/            # DOM/accessibility snapshot + grounding
│   ├── executor/              # action execution + safety gate
│   ├── verifier/              # post-action verification
│   ├── reasoning/             # reasoning engine + provider adapters
│   ├── orchestrator/          # control loop, policy, budgets
│   ├── server/                # Fastify API, SSE, embeddability contract endpoints
│   ├── widget/                # embeddable Preact SDK
│   ├── trace-viewer/          # trace replay SPA
│   ├── eval/                  # benchmark task definitions + runner
│   └── fixture-site/          # self-hosted deterministic test sandbox website
├── apps/
│   └── demo-host/             # minimal page embedding the widget for demoing
└── scripts/
    ├── bootstrap.sh
    └── run-fixture-site.sh
```

### Package-by-package explanation

| Package        | Owns                                                                     | Depends on                                                         | Must never depend on                                 |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------- |
| `core`         | Types, Zod schemas, Action vocabulary, TraceEvent schema, error taxonomy | nothing internal                                                   | any other package                                    |
| `trace`        | Persisting and querying trace events                                     | `core`                                                             | `orchestrator`, `server`                             |
| `perception`   | Snapshot capture, element indexing, grounding (ref → locator)            | `core`                                                             | `reasoning`, `orchestrator`                          |
| `executor`     | Executing one action, safety gate                                        | `core`                                                             | `reasoning`, `verifier`                              |
| `verifier`     | Structural + fallback verification of one action's effect                | `core`, `reasoning` (only for fallback judgment call)              | `executor`, `orchestrator`                           |
| `reasoning`    | LLM provider abstraction + prompt construction                           | `core`                                                             | `perception`, `executor`, `verifier`, `orchestrator` |
| `orchestrator` | Control loop, policy, budgets, embeddability lifecycle                   | `core`, `trace`, `perception`, `executor`, `verifier`, `reasoning` | `server` (server depends on it, not vice versa)      |
| `server`       | HTTP/SSE surface, wiring, config, safety-policy loading                  | `orchestrator`, `trace`, `core`                                    | `widget`                                             |
| `widget`       | Embeddable client SDK, UI for progress/approval                          | `core` (types only, via published types)                           | server internals                                     |
| `trace-viewer` | Standalone read-only trace inspection SPA                                | `core`, HTTP client to `server`                                    | orchestrator internals                               |
| `eval`         | Benchmark task definitions, harness runner, report generation            | `orchestrator`, `core`, `fixture-site`                             | `server`                                             |
| `fixture-site` | Deterministic test sandbox website                                       | nothing                                                            | everything else                                      |

This dependency table is enforced by `.dependency-cruiser.cjs` in CI — any violation fails the build. This is the static enforcement referenced in NFR8.

## Configuration Files (what each contains, conceptually)

- `tsconfig.base.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, ES2022 target, module resolution `NodeNext`. Every package extends this.
- `.eslintrc.cjs`: TypeScript-eslint recommended + strict, import-order rule, no-floating-promises, no-explicit-any (error, with narrow documented override mechanism).
- `.dependency-cruiser.cjs`: encodes the dependency table above as forbidden-rules.
- `.prettierrc`: standard formatting, no debate — formatting is automated, never manually argued about.
- `.commitlintrc.cjs`: Conventional Commits enforced.
- `.env.example`: documents every environment variable (below) with placeholder values and comments — never real secrets.
- `docker-compose.yml`: one service for the server (embeds Chromium), volume-mounts SQLite file, exposes port; optional second service for Ollama if the local-model profile is selected.

## Environment Variables

| Variable                     | Purpose                                                   | Default                        |
| ---------------------------- | --------------------------------------------------------- | ------------------------------ |
| `REASONING_PROVIDER`         | `gemini` \| `claude` \| `openai` \| `ollama` \| `fixture` | `ollama` (zero-cost default)   |
| `REASONING_API_KEY`          | Provider API key (unused for `ollama`/`fixture`)          | —                              |
| `REASONING_MODEL`            | Model identifier for chosen provider                      | provider-specific default      |
| `OLLAMA_BASE_URL`            | Local Ollama endpoint                                     | `http://localhost:11434`       |
| `DATABASE_PATH`              | SQLite file path for trace storage                        | `./data/trace.db`              |
| `ALLOWED_DOMAINS`            | Comma-separated safety allowlist                          | `localhost,fixture-site.local` |
| `MAX_STEPS_PER_TASK`         | Budget                                                    | `40`                           |
| `MAX_RETRIES_PER_STEP`       | Budget                                                    | `2`                            |
| `MAX_REPLANS_PER_TASK`       | Budget                                                    | `3`                            |
| `MAX_WALL_CLOCK_MS`          | Budget                                                    | `300000`                       |
| `MAX_MODEL_CALLS_PER_TASK`   | Budget                                                    | `60`                           |
| `SERVER_PORT`                | HTTP port                                                 | `3000`                         |
| `LOG_LEVEL`                  | `debug`\|`info`\|`warn`\|`error`                          | `info`                         |
| `RATE_LIMIT_PER_IP_PER_HOUR` | Abuse control for public deploy                           | `10`                           |

## Dependency List and Justification (technology decisions)

| Concern                         | Choice                             | Why chosen over alternatives                                                                                                                                     | Free-tier limitation                                               | Migration path                                                  |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Language                        | TypeScript (strict)                | One language across server, widget, viewer, tooling; strongest ecosystem fit for both Playwright and embeddable web SDKs; type-shared contracts between packages | none (fully free/OSS)                                              | n/a                                                             |
| Runtime                         | Node.js LTS                        | Ubiquitous, first-class Playwright support, huge community                                                                                                       | none                                                               | n/a                                                             |
| Monorepo tool                   | npm workspaces                     | Zero extra config vs. Nx/Turborepo; sufficient at this package count                                                                                             | none                                                               | Turborepo later if build times grow                             |
| Browser automation              | Playwright                         | Best-in-class auto-waiting, accessibility snapshot API, network control, tracing; MS-maintained, OSS, free                                                       | none (self-hosted browsers)                                        | n/a                                                             |
| Perception source               | Accessibility tree (ARIA snapshot) | Compact, semantic, far cheaper and more stable than raw HTML or screenshots; avoids research-grade vision-grounding problem                                      | n/a                                                                | Add vision fallback later for canvas-heavy sites if needed      |
| Web framework                   | Fastify                            | Native JSON-schema validation, faster and lighter than Express+middleware stack, less ceremony than NestJS                                                       | none                                                               | n/a                                                             |
| Schema/validation               | Zod                                | Single source of truth for types + runtime validation, used at every subsystem boundary and API boundary                                                         | none                                                               | n/a                                                             |
| ORM/storage                     | Prisma + SQLite                    | Zero external infra, migrations included, type-safe queries; sufficient for single-instance trace storage                                                        | SQLite has no concurrent-writer scaling — acceptable at this scale | Swap datasource to Postgres later; Prisma schema unchanged      |
| Test runner                     | Vitest                             | Native ESM/TS, fast, Jest-compatible API                                                                                                                         | none                                                               | n/a                                                             |
| Static architecture enforcement | dependency-cruiser                 | Encodes the subsystem dependency table as a CI-enforced rule set                                                                                                 | none                                                               | n/a                                                             |
| Widget UI                       | Preact                             | React-compatible API at ~3KB, critical for an embeddable script that must not bloat host pages                                                                   | none                                                               | Swap to React trivially if bundle size stops mattering          |
| Local LLM                       | Ollama                             | Fully free, self-hosted, deterministic-enough at temp=0 for dev/CI smoke tests, no network dependency                                                            | Requires local compute; smaller models are less capable            | Point `REASONING_PROVIDER` at a cloud adapter, zero code change |
| Cloud LLM (default demo)        | Gemini API (free tier)             | Genuinely free tier with usable rate limits, function-calling support                                                                                            | Rate-limited requests/day                                          | Swap provider adapter to Claude/OpenAI via env var              |
| CI                              | GitHub Actions                     | Free for public repos, native to GitHub                                                                                                                          | Minutes cap on private repos (irrelevant — repo is public)         | n/a                                                             |
| Container registry              | GitHub Container Registry          | Free for public images                                                                                                                                           | none                                                               | n/a                                                             |
| Hosting (optional live demo)    | Cloud Run (or Fly.io) free tier    | Scale-to-zero, generous free compute-seconds, supports custom Docker images with Chromium deps                                                                   | Cold starts; limited concurrent memory                             | Move to dedicated VM if traffic ever justifies it               |

## Development Workflow / Local Setup

1. `git clone` → `npm install` (workspaces install all packages).
2. `cp .env.example .env`, defaults work with zero external accounts (`REASONING_PROVIDER=ollama` or `fixture`).
3. `docker compose up` — starts server + (optional) Ollama + fixture site.
4. `npm run dev` — runs server, widget dev build, and demo-host concurrently with hot reload.
5. `npm test` — full unit + contract suite, no browser/network required.
6. `npm run test:integration` — spins up fixture site + real Chromium, uses scripted fake provider.
7. `npm run eval` — runs the benchmark suite against the configured `REASONING_PROVIDER`.

## Commit Conventions

Conventional Commits, scoped to package: `feat(perception): add ARIA snapshot indexing`, `fix(orchestrator): correct replan budget check`. Enforced via commit-lint pre-push hook (Husky, free/OSS) and in CI.

---

# PHASE 2 — CORE CONTRACTS, TRACE INFRASTRUCTURE, FIXTURE SITE

## Objective

Freeze every cross-subsystem contract before any subsystem logic is written. Stand up the persistent, passive Trace Recorder. Build the self-hosted deterministic test sandbox website.

## Why this phase exists

This is the fork point of the entire project (see 0.2). Nothing in Phases 3–6 can be parallelized correctly, and nothing can be tested deterministically, until these contracts and the sandbox environment exist. Getting this phase wrong propagates errors into every subsystem; it deserves disproportionate care.

## Deliverables

- `packages/core`: Action vocabulary, `Intent`, `Plan`, `PerceptionSnapshot`, `ElementNode`, `VerificationResult`, `TraceEvent`, `TaskConfig`, `SafetyPolicy`, error taxonomy — all as Zod schemas with inferred TS types.
- `packages/trace`: append-only event writer, query-by-task API, SQLite-backed via Prisma.
- `packages/fixture-site`: static/lightweight-server multi-page test sandbox (login, search+results, cart+checkout, multi-step wizard, dynamic/delayed content, a "structurally unstable" variant page).

## Repository changes

Adds all files under `packages/core`, `packages/trace`, `packages/fixture-site`. Adds `prisma/schema.prisma` under `packages/trace`. No other packages modified (they don't exist yet).

## Data Structures (binding — Phases 3–9 must conform exactly)

```ts
// --- Action vocabulary (closed set, never free-form) ---
type Action =
  | { type: "click"; ref: string }
  | { type: "type"; ref: string; text: string; clear?: boolean }
  | { type: "select"; ref: string; value: string }
  | { type: "check"; ref: string; checked: boolean }
  | { type: "scroll"; ref?: string; direction: "up" | "down"; amount?: number }
  | { type: "navigate"; url: string }
  | { type: "extract"; ref: string; variableName: string }
  | { type: "wait"; forRef?: string; timeoutMs: number }
  | { type: "finish"; intentId: string; success: boolean; resultSummary: string }
  | { type: "ask_human"; question: string };

interface ElementNode {
  ref: string; // stable within one snapshot only
  role: string; // accessibility role
  name: string; // accessible name
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  visible: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  path: string[]; // ancestor role chain
}

interface PerceptionSnapshot {
  snapshotId: string;
  taskId: string;
  timestamp: string;
  url: string;
  title: string;
  elements: ElementNode[];
  screenshotRef?: string;
}

interface Intent {
  id: string;
  description: string;
  successCriteriaHint: string;
  riskLevel: "safe" | "sensitive";
}

interface Plan {
  taskId: string;
  goal: string;
  intents: Intent[];
  createdAt: string;
  version: number;
}

interface VerificationResult {
  outcome: "success" | "failure" | "ambiguous";
  method: "structural" | "model-assisted";
  evidence: {
    urlChanged?: boolean;
    domDiffSummary?: string;
    targetElementAppeared?: string;
    targetElementDisappeared?: string;
    modelRationale?: string;
  };
  confidence: number;
}

type PolicyDecision =
  "CONTINUE" | "RETRY_STEP" | "REPLAN" | "ESCALATE_TO_HUMAN" | "ABORT_TASK" | "TASK_COMPLETE";

interface TraceEvent {
  eventId: string;
  taskId: string;
  timestamp: string;
  subsystem: "orchestrator" | "reasoning" | "perception" | "executor" | "verifier";
  eventType: string;
  payload: Record<string, unknown>;
  durationMs?: number;
  parentEventId?: string;
}

interface SafetyPolicy {
  allowedDomains: string[];
  sensitiveActionKeywords: string[];
  requireApprovalForSensitive: boolean;
  maxStepsPerTask: number;
  maxRetriesPerStep: number;
  maxReplansPerTask: number;
  maxWallClockMs: number;
  maxModelCallsPerTask: number;
}
```

Every schema exists as a Zod schema in `core`; TS types are `z.infer<>` of the schema — single source of truth, no duplicate hand-written interfaces anywhere downstream.

## APIs (internal package APIs — no HTTP yet)

`trace` package exposes exactly two functions: `record(event: Omit<TraceEvent,"eventId"|"timestamp">): Promise<void>` and `query(taskId: string): Promise<TraceEvent[]>`. No update, no delete — trace is append-only by design (auditability requirement).

## UI

None in this phase.

## Backend

`trace` package's storage layer only; no server yet.

## AI

None — this phase is deliberately model-free, by design, to keep it deterministic and independently testable.

## Browser Automation

`fixture-site` is a plain server-rendered multi-page site (no SPA framework needed — simplicity, and it must be trivially inspectable via view-source for debugging). Required pages:

1. `/login` — username/password form, redirects to `/dashboard` on correct credentials, shows inline error otherwise.
2. `/search` — text input + results list rendered after a deliberate artificial delay (tests waiting/timing robustness).
3. `/catalog`, `/product/:id`, `/cart`, `/checkout` — add-to-cart flow; checkout button is a "sensitive" action for safety-gate testing.
4. `/wizard` — 3-step form requiring state carried across steps.
5. `/unstable` — same login form as `/login` but regenerates non-semantic attributes (class names, DOM ordering of decorative wrapper divs) on every load, while accessibility roles/names remain stable — this page exists specifically to validate that grounding survives structural churn, which is the central hard problem identified in Phase 1 discovery.

## Testing

Unit tests: Zod schema round-trip tests (valid/invalid payloads for every schema). `trace` package: write N events, query returns them in order, ordering is stable, no event is ever mutated. Fixture site: a smoke test asserting every route returns 200 and expected landmark elements exist.

## Acceptance Criteria

- All core schemas compile, are exported, and have ≥1 valid + ≥1 invalid test case each.
- `trace.record` → `trace.query` round-trips correctly for 100+ events across multiple task IDs without cross-contamination.
- Fixture site runs via `npm run dev` and all six pages are reachable and independently functional without JavaScript frameworks.
- Dependency-cruiser passes with the Phase-1 boundary rules already partially enforceable (core has zero internal deps).

## Demo

`docker compose up` starts the fixture site; a developer can manually click through login → catalog → cart → checkout in a plain browser, and separately run a script that writes/queries trace events, proving the recorder works end-to-end.

## Review Checklist

- Does any schema allow an invalid/ambiguous action shape to type-check? (Must be no.)
- Is the action vocabulary exhaustive enough for every fixture-site task in Phase 9, and no more than that? (No speculative actions.)
- Can `trace` be unit tested with zero dependency on any other package? (Must be yes.)
- Does the `/unstable` fixture page actually vary structurally between loads while preserving accessible names? (Verify by diffing two loads.)

---

# PHASE 3 — PERCEPTION & GROUNDING LAYER

## Objective

Convert live browser state into the `PerceptionSnapshot` shape; resolve an `Action`'s `ref` into a concrete, executable browser locator.

## Why this phase exists

This is the sensor of the control loop and the layer that owns the cost/accuracy tradeoff of state representation — identified in Phase 1 discovery as one of the hardest problems. It must be provably deterministic and testable without any model call before the Reasoning Engine is built, so that later failures can always be isolated to "the model chose wrong" vs. "the sensor lied."

## Deliverables

`packages/perception`: `capture(page): Promise<PerceptionSnapshot>`, `resolve(snapshot, ref): Locator`, an internal element-indexing algorithm over the Playwright accessibility tree, visibility filtering, and a bounded truncation strategy for very large pages (cap element count, prioritize interactive + landmark roles, drop deeply nested decorative nodes).

## Repository changes

Adds `packages/perception/*`. No other package modified.

## APIs

```ts
interface PerceptionPort {
  capture(page: BrowserPage): Promise<PerceptionSnapshot>;
  resolve(snapshot: PerceptionSnapshot, ref: string): ResolvedTarget; // throws typed GroundingError if ref invalid/stale
}
interface ResolvedTarget {
  locatorHandle: unknown;
  elementNode: ElementNode;
}
```

Errors: `GroundingError` (`ref not found in snapshot`, `element detached from DOM since snapshot`, `element not visible/interactable`) — typed, never a raw thrown string, so the Orchestrator can pattern-match on failure category.

## Data Structures

As defined in Phase 2, unchanged. This phase implements the _producer_ of `PerceptionSnapshot`/`ElementNode` and the _resolver_ from `ref` to a live locator.

## UI

None.

## Backend

None (library only, consumed later by Orchestrator/server).

## AI

None — must remain fully model-free. This is a deliberate, testable boundary (NFR3, NFR9).

## Browser Automation

**Execution flow:** on `capture`, request the page's accessibility snapshot, walk it, assign a stable-within-snapshot `ref` (`e0`, `e1`, ...) to every node with an interactive role or meaningful landmark/text role, filter out invisible/zero-size nodes, cap total elements (e.g., 150) prioritizing interactive elements nearest the viewport, and correlate each retained node with a bounding box (used later for live-view highlighting and screenshot correlation, not for grounding itself). `resolve` re-derives a Playwright locator from the same node using role+accessible-name+position, and must fail with a typed error rather than silently grabbing the wrong element if the page has since changed enough that the original node cannot be confidently re-identified.

**Observation:** snapshot taken fresh before every reasoning call — never reused across steps, since staleness is a primary source of grounding failure.

**Verification:** N/A (owned by Phase 5).

**Recovery:** grounding failures are typed and returned, not thrown as generic exceptions — Orchestrator (Phase 7) decides the response (retry with fresh snapshot, escalate).

**Retries:** none internal to this package — retries are an Orchestrator policy concern, not a Perception concern (single-responsibility boundary).

**Safety:** N/A here — enforced in Executor (Phase 4), not Perception, since Perception never mutates state.

## Testing

Unit tests using Playwright against the Phase 2 fixture site (real browser, no model): capture on `/login` must include username/password/submit with correct roles; capture on `/unstable` across two reloads must produce different underlying DOM but stable accessible names for the same logical elements; `resolve` on a stale ref (page navigated away) must return `GroundingError`, never a wrong element; element cap behavior tested on a synthetic page with 500+ elements.

Edge cases: hidden elements excluded; disabled elements included but flagged `disabled: true`; iframes explicitly out of scope for v1 (documented as a known limitation, not silently mishandled).

## Acceptance Criteria

- `capture` and `resolve` pass all unit tests against every fixture-site page with zero flakiness across 20 consecutive runs.
- No test in this package makes a network call to any LLM provider.
- Grounding survives the `/unstable` page's structural churn (proves the accessibility-tree strategy over raw-DOM/selector strategy).

## Demo

A CLI script (`npm run demo:perception`) that navigates to any fixture page, prints the captured snapshot as readable JSON, accepts a `ref`, and highlights the corresponding element on-screen (headed browser mode) — visually proving grounding correctness.

## Review Checklist

- Is any part of this package's correctness dependent on wording or output from an LLM? (Must be no.)
- Does `resolve` ever silently return a "close enough" element instead of failing explicitly? (Must be no — silent wrongness is worse than explicit failure.)
- Is the element cap justified by a documented cost/accuracy rationale, not an arbitrary number?

---

# PHASE 4 — EXECUTOR & SAFETY GATE

## Objective

Execute exactly one resolved action against the live browser, deterministically, and enforce the safety policy chokepoint before any effectful action.

## Why this phase exists

This is the actuator of the control loop and the single point through which every side effect must pass — this is what makes the safety story real and auditable rather than aspirational (NFR5).

## Deliverables

`packages/executor`: `execute(action, resolvedTarget, policy): Promise<ExecutionResult>`, safety evaluation function `evaluate(action, resolvedTarget, policy): SafetyDecision`.

## Repository changes

Adds `packages/executor/*`.

## APIs

```ts
interface ExecutorPort {
  execute(action: Action, target: ResolvedTarget): Promise<ExecutionResult>;
}
interface ExecutionResult {
  status: "executed" | "failed";
  errorCategory?: "not_interactable" | "timeout" | "navigation_blocked" | "unknown";
  startedAt: string;
  finishedAt: string;
}
interface SafetyGate {
  evaluate(
    action: Action,
    target: ResolvedTarget | null,
    policy: SafetyPolicy,
  ):
    | { decision: "allow" }
    | { decision: "require_approval"; reason: string }
    | { decision: "deny"; reason: string };
}
```

## Data Structures

`ExecutionResult`, `SafetyDecision` as above, added to `core`.

## UI

None.

## Backend

None directly (library, wired into Orchestrator).

## AI

None — must remain fully model-free (mirrors Perception's boundary discipline).

## Browser Automation

**Execution flow:** given one `Action` + its `ResolvedTarget`, perform exactly one Playwright operation (click/fill/select/etc.), using built-in auto-waiting with an explicit bounded timeout (never infinite wait). `navigate` actions are checked against `allowedDomains` **inside this package**, unconditionally, even if the Reasoning Engine or Orchestrator somehow requested it — defense in depth, not reliance on the model behaving.

**Safety gate logic:** before executing, `evaluate()` checks: (a) is the action's target domain in `allowedDomains` → if not, `deny` outright, never escalate (an out-of-policy domain is not a judgment call); (b) does the action's target element's accessible name/role match a `sensitiveActionKeywords` entry, or is it a `navigate`/`type`-into-payment-like-field heuristic → `require_approval`; (c) otherwise `allow`.

**Observation:** N/A (Executor does not interpret state, only acts on it).

**Verification:** explicitly not owned here — Executor reports only mechanical success/failure of the operation itself (e.g., "click landed"), never semantic success (Phase 5 owns that distinction, and this separation is deliberate and load-bearing per the architecture review).

**Recovery:** typed `errorCategory` returned on mechanical failure; no internal retry (Orchestrator policy owns retries).

**Retries:** none internal — same single-responsibility rationale as Perception.

**Safety:** this package **is** the safety subsystem; no other package may execute a browser mutation.

## Testing

Unit/integration tests against the fixture site: every action type executed successfully against its intended element; sensitive keyword detection tested against the `/checkout` "Confirm Purchase" button (must return `require_approval`); domain-allowlist denial tested by attempting `navigate` to a non-allowlisted domain (must return `deny`, and the navigation must provably not occur — assert page URL unchanged); mechanical failure tested against a disabled/non-interactable element (must return typed `failed`, never throw uncaught).

## Acceptance Criteria

- 100% of sensitive-action test cases route through `require_approval`, zero false negatives (a false negative here is a critical defect, treated as a release blocker).
- Domain allowlist denial is enforced even when called directly with a malicious action bypassing normal flow (tested explicitly as an adversarial unit test).
- No test in this package makes any LLM call.

## Demo

CLI script executing a scripted sequence of actions against `/checkout`, demonstrably pausing at the "Confirm Purchase" button with a `require_approval` result printed, and demonstrably refusing an out-of-allowlist navigation attempt.

## Review Checklist

- Can any action reach browser mutation without passing through `evaluate()` first? (Must be architecturally impossible, not just conventionally avoided.)
- Is the sensitive-keyword list configurable, not hardcoded, so self-hosters can extend it? (Must be yes.)
- Does denial ever depend on model output? (Must be no — domain/keyword checks are pure functions of policy + DOM state.)

---

# PHASE 5 — VERIFIER

## Objective

Given a before-snapshot, an executed action, an after-snapshot, and the intent, produce a `VerificationResult` judging whether the action achieved its intended effect.

## Why this phase exists

The environment gives no native success/failure signal (Phase 1 discovery, hardest-problem #3). Something must own turning raw after-state into a verdict, structurally first, and this logic is substantial enough to deserve independent testability.

## Deliverables

`packages/verifier`: layered verification — structural checks first (URL delta, target-element appearance/disappearance, DOM diff of relevant region), model-assisted fallback only invoked when structural checks are genuinely inconclusive.

## Repository changes

Adds `packages/verifier/*`. This is the **only** non-reasoning package permitted to depend on `reasoning`, and only for its narrow fallback path — documented explicitly as an exception to the general rule, with justification in an ADR.

## APIs

```ts
interface VerifierPort {
  verify(input: {
    intent: Intent;
    action: Action;
    before: PerceptionSnapshot;
    after: PerceptionSnapshot;
    executionResult: ExecutionResult;
  }): Promise<VerificationResult>;
}
```

## Data Structures

`VerificationResult` as defined in Phase 2.

## UI

None.

## Backend

None directly.

## AI

**Fallback path only.** If structural evidence is ambiguous (e.g., DOM changed but not in a way that maps clearly to the intent's `successCriteriaHint`), issue exactly one bounded reasoning call: "given this intent, this hint, and this before/after summary, is this success, failure, or still ambiguous, with brief rationale." This call is capped at one per verification (never a loop), and its result is always tagged `method: "model-assisted"` in the trace so a reviewer can always tell which verdicts were structural (trustworthy) vs. judged (softer).

## Browser Automation

**Observation:** consumes snapshots already captured by Perception — does not capture its own, avoiding duplicate browser round-trips (efficiency + determinism: verifier and orchestrator must observe the exact same state).

**Verification logic (structural, primary path):**

- If `executionResult.status === "failed"` → immediate `outcome: "failure"`, no further checks needed.
- If intent hint references a URL change and `before.url !== after.url` in the expected direction → `success`.
- If intent hint references appearance of an element (e.g., "results are displayed") and a matching-role/name element exists in `after` but not `before` → `success`.
- If intent hint references disappearance (e.g., "modal closed") and the inverse holds → `success`.
- If none of the above patterns match confidently → `ambiguous`, escalate to the model-assisted fallback.

**Recovery:** N/A — Verifier reports, it does not react (mirrors Phase 5 architecture rationale: detection is separate from policy).

**Retries:** none — a single verification call per action-execution; retries of the _action_ are decided by Orchestrator based on this verdict.

**Safety:** N/A.

## Testing

Unit tests with synthetic before/after snapshot fixtures (no browser needed) covering: clear success via URL change, clear success via element appearance, clear failure via unchanged state after a purported form submission, and a genuinely ambiguous case routed to a **mocked** reasoning provider (never live in unit tests) verified to be called exactly once. Integration test: real login flow on fixture site, structural path only, no fallback needed — confirms the primary path handles the common case without ever invoking the model (important cost/latency proof point).

## Acceptance Criteria

- ≥ 90% of fixture-site benchmark verifications resolve via the structural path alone (documented metric, proves the layered design actually reduces model dependency rather than just adding a wrapper around it).
- The model-assisted fallback is provably bounded to exactly one call per verification event, under adversarial mock testing (mock always returns "ambiguous" — must not loop).

## Demo

Script running the full login task twice: once shown resolving via structural evidence alone (fast, free), once against an intentionally ambiguous synthetic case falling back to the model, with both trace entries printed side-by-side to show the `method` field difference.

## Review Checklist

- Can this package ever enter an unbounded loop calling the reasoning fallback? (Must be provably no.)
- Is the structural/model-assisted distinction visible in every output, not just internally? (Must be yes — this is the explainability payoff.)
- Does the fallback path ever get to unilaterally decide the _task's_ fate, or only this one verification event? (Must be the latter only.)

---

# PHASE 6 — REASONING ENGINE

## Objective

Provide the two model-consulting operations — `decomposeGoal` and `decideNextAction` — behind a provider-agnostic interface, with a fixed, closed action-output schema, and deterministic, cost-free test fixtures.

## Why this phase exists

This is the only subsystem permitted to be non-deterministic (Phase 1/5 rationale). Isolating it behind a narrow, swappable interface is what allows every other subsystem to remain provably deterministic and independently testable — the architectural spine of the whole project.

## Deliverables

`packages/reasoning`: `ReasoningProvider` interface; adapters for Gemini, Claude, OpenAI, Ollama; a `FixtureReplayProvider` (records/replays real request-response pairs as JSON "cassettes" for deterministic CI); a `ScriptedFakeProvider` (fully synthetic, hand-coded logic, used by other packages' integration tests so they never depend on network or fixtures); prompt templates versioned under `docs/prompts/`; strict output-schema validation with a bounded repair loop (max 1 re-ask) if the model returns malformed output.

## Repository changes

Adds `packages/reasoning/*`, `docs/prompts/*`.

## APIs

```ts
interface ReasoningProvider {
  decomposeGoal(input: { goal: string; startUrl: string }): Promise<Plan>;
  decideNextAction(input: {
    intent: Intent;
    perception: PerceptionSnapshot;
    recentHistory: StepRecord[];
    historySummary: string;
    variables: Record<string, string>;
  }): Promise<{ action: Action; rationale: string }>;
}
interface StepRecord {
  action: Action;
  verification: VerificationResult;
  timestamp: string;
}
```

Errors: `MalformedOutputError` (schema validation failed even after one repair attempt — this is a first-class, expected failure mode, not an exception to swallow); `ProviderUnavailableError` (network/auth failure).

## Data Structures

`StepRecord` added to `core`. Prompt inputs are always constructed from `PerceptionSnapshot`'s compact `ElementNode` list (never raw HTML) — this is the concrete embodiment of the state-representation decision from Phase 1.

## UI

None.

## Backend

None directly.

## AI — Prompting strategy (binding)

**Context construction rule:** the model never sees raw HTML. It sees: the current intent + hint, the compact element list (`ref`, `role`, `name`, `value`, `disabled`) capped per Phase 3, the last N (e.g., 5) `StepRecord`s verbatim, a rolling natural-language `historySummary` compacting everything older (generated by the model itself at replan boundaries, capped in length), and the `variables` map from prior `extract` actions. This bounds context growth explicitly — addressing the context-window-growth risk identified in Phase 1.

**Output contract:** the model must return exactly one `Action` from the closed vocabulary, as structured output (function-calling/tool-calling where the provider supports it; strict JSON-schema-validated parsing otherwise), plus a short natural-language `rationale` string — the rationale is not used by any control-flow logic, it exists purely for the Trace Recorder / explainability, and this must be explicit in the prompt design so nobody is tempted to parse it programmatically later.

**decomposeGoal contract:** returns 3–8 coarse intents (hard cap — a plan needing more than 8 top-level intents should be treated as a signal to replan mid-flight, not to front-load an enormous plan); each intent gets a `riskLevel` pre-classification which the Executor's safety gate re-validates at execution time independently (never trusted blindly — defense in depth again).

**Malformed output handling:** one re-ask with the validation error appended to context; second failure raises `MalformedOutputError` to the Orchestrator, which treats it as a step failure subject to normal retry/escalate policy — never a silent default action.

## Browser Automation

N/A — this package never touches the browser directly.

## Testing

Unit tests: every provider adapter tested against recorded cassette fixtures (zero network calls in default CI), covering well-formed output, malformed-then-repaired output, and permanently malformed output. `ScriptedFakeProvider` tested to deterministically complete every Phase 9 benchmark task, used by Orchestrator's own tests so Phase 7 never needs a live model to test control flow. A separate, explicitly-tagged live-provider smoke test (run in `eval.yml`, not `ci.yml`) exercises Ollama and/or the configured free-tier cloud provider for real.

## Acceptance Criteria

- Every provider adapter passes the identical contract test suite (interchangeability proof — this is the actual point of the Strategy-pattern design and must be demonstrated, not asserted).
- Switching `REASONING_PROVIDER` requires zero code changes anywhere outside `reasoning`'s own config loading.
- Malformed-output repair loop is provably bounded to one retry under adversarial mock testing.

## Demo

CLI script running `decomposeGoal("Buy the cheapest item in the catalog", startUrl)` against the local Ollama model and printing the resulting plan; re-run against Gemini with only an env var change, printing both plans side by side to demonstrate provider interchangeability.

## Review Checklist

- Does any other package parse or depend on the `rationale` string's content for control flow? (Must be no — it is explanation-only.)
- Is the action vocabulary the model can emit identical to the one Executor can execute — no superset, no subset? (Must match exactly, checked via shared `core` schema import.)
- Can this package's non-determinism leak into another package's tests? (Must be no — verified by Phases 3–5 having zero live-model tests.)

---

# PHASE 7 — ORCHESTRATOR (Control Loop) — First End-to-End Agent

## Objective

Assemble Perception, Executor, Verifier, and Reasoning into the closed control loop; own all policy decisions (retry/replan/escalate/abort); own budgets; own the embeddability lifecycle contract at the code level (HTTP wiring comes in Phase 8).

## Why this phase exists

This is the synchronization point of the whole build (0.2). It is where the system becomes an agent rather than four well-tested libraries. It is also where reliability is actually won or lost — this phase deserves the most adversarial testing of the entire project.

## Deliverables

`packages/orchestrator`: the control loop, the policy decision function, budget tracking, task lifecycle state machine, and the escalation/approval wait mechanism.

## Repository changes

Adds `packages/orchestrator/*`. First package to import from all of `core`, `trace`, `perception`, `executor`, `verifier`, `reasoning`.

## Data Structures

```ts
type TaskStatus =
  | "PLANNING"
  | "RUNNING"
  | "AWAITING_APPROVAL"
  | "REPLANNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

interface TaskContext {
  taskId: string;
  goal: string;
  startUrl: string;
  status: TaskStatus;
  plan: Plan;
  cursor: number;
  history: StepRecord[];
  historySummary: string;
  variables: Record<string, string>;
  budgets: {
    stepsUsed: number;
    retriesUsedThisStep: number;
    replansUsed: number;
    modelCallsUsed: number;
    startedAt: string;
  };
  pendingApproval?: { reason: string; proposedAction: Action };
}
```

## APIs (internal, HTTP wrapper is Phase 8)

```ts
interface OrchestratorPort {
  startTask(
    goal: string,
    startUrl: string,
    config?: Partial<SafetyPolicy>,
  ): Promise<{ taskId: string }>;
  approve(taskId: string, approved: boolean, note?: string): Promise<void>;
  cancel(taskId: string): Promise<void>;
  getStatus(taskId: string): TaskContext;
  subscribe(taskId: string, onEvent: (e: TraceEvent) => void): Unsubscribe;
}
```

## Control loop (binding algorithm)

```
1. status = PLANNING
2. plan = reasoning.decomposeGoal(goal, startUrl); record(trace: "plan.created")
3. status = RUNNING
4. loop:
     checkBudgets() -> if exceeded: status = FAILED, reason = "budget_exceeded"; break
     intent = plan.intents[cursor]
     if intent undefined: status = COMPLETED; break

     before = perception.capture(page); record("perception.captured")
     {action, rationale} = reasoning.decideNextAction(intent, before, recentHistory, historySummary, variables)
     record("reasoning.decided", {action, rationale})

     if action.type == "finish":
         record verdict; cursor++; resetStepBudgets(); continue
     if action.type == "ask_human":
         status = AWAITING_APPROVAL; pendingApproval = {reason: action.question}; await external approve(); continue
     if action.type == "extract":
         value = read text from resolved element; variables[action.variableName] = value; continue (no execution/verification needed)

     resolved = perception.resolve(before, action.ref)   // may throw GroundingError
     safety = executor.evaluate(action, resolved, policy)
     if safety.decision == "deny": treat as step failure -> policyDecision path below
     if safety.decision == "require_approval":
         status = AWAITING_APPROVAL; pendingApproval = {reason: safety.reason, proposedAction: action}
         await external approve()
         if not approved: treat as step failure; continue
         status = RUNNING

     result = executor.execute(action, resolved); record("action.executed")
     after = perception.capture(page)
     verification = verifier.verify({intent, action, before, after, executionResult: result})
     record("verification.completed", verification)

     decision = decidePolicy(verification, budgets, policy)
     record("policy.decision", decision)
     switch decision:
       CONTINUE:        history.push(...); continue
       RETRY_STEP:      budgets.retriesUsedThisStep++; if exceeds max -> escalate to REPLAN instead; continue same intent
       REPLAN:          budgets.replansUsed++; if exceeds max -> ABORT_TASK; else: plan = reasoning.decomposeGoal(goal with updated context+history summary); cursor = 0 (resume from first incomplete intent); status stays RUNNING
       ESCALATE_TO_HUMAN: status = AWAITING_APPROVAL; await
       ABORT_TASK:      status = FAILED; break
5. record("task.finished", {status})
```

**Policy decision function (deterministic, pure, unit-testable in total isolation):**

```
decidePolicy(verification, budgets, policy):
  if verification.outcome == "success": return CONTINUE
  if verification.outcome == "failure":
      if budgets.retriesUsedThisStep < policy.maxRetriesPerStep: return RETRY_STEP
      if budgets.replansUsed < policy.maxReplansPerTask: return REPLAN
      return ABORT_TASK
  if verification.outcome == "ambiguous":
      return ESCALATE_TO_HUMAN   // never guess silently on genuine ambiguity
```

This function is the single most important piece of code in the project from an interview-defensibility standpoint — it must be pure, total (handles every enum combination), and have 100% branch coverage.

## UI

None directly (Phase 8 owns HTTP/UI wiring); this phase exposes the `subscribe` callback mechanism the server will bridge to SSE.

## Backend

This _is_ the backend's core logic, pre-HTTP.

## AI

Consumes `reasoning` as configured; owns the decision of _when_ to call it (once for planning, once per step, once per replan) — never calls it speculatively or redundantly.

## Browser Automation

Owns nothing directly — delegates to Perception/Executor/Verifier — but owns the _sequencing and timing_ of their calls, which is precisely the "policy vs. mechanism" separation defended in the architecture review.

**Recovery:** Every subsystem call in the loop is wrapped so that a typed error (GroundingError, ExecutionResult.failed, MalformedOutputError, ProviderUnavailableError) is converted into a `VerificationResult`-equivalent failure signal feeding the same `decidePolicy` function — there is exactly one failure-handling code path in the entire system, not one per subsystem. This is a deliberate simplification and should be called out as such.

**Safety:** the approval-wait mechanism must have its own timeout (`policy.maxWallClockMs` applies globally including time spent awaiting approval) so a task can never hang forever if a host application disappears.

## Testing

This phase gets the heaviest test investment in the project.

- Unit tests of `decidePolicy` — every input combination, 100% branch coverage, including exceeded-budget edge cases at exact boundary values (off-by-one is a classic bug here).
- Integration tests using `ScriptedFakeProvider` + real fixture-site browser + real Perception/Executor/Verifier: full successful login task; a task that requires exactly one retry (fake provider deliberately wrong once); a task that requires a replan (fake provider changes strategy mid-task); a task that hits the sensitive-action gate and pauses correctly; a task that exceeds `maxStepsPerTask` and aborts cleanly with a clear reason (never crashes); a task cancelled mid-flight by an external caller.
- Chaos-style tests: kill the browser page mid-task (simulate a crash) and assert the Orchestrator resolves to `FAILED` with a clear error, never hangs and never throws unhandled.

## Acceptance Criteria

- All fixture-site benchmark tasks (Phase 9 list) complete successfully end-to-end using `ScriptedFakeProvider`, proving the control loop's mechanics are correct independent of model quality.
- At least one test proves each of: retry path, replan path, escalation path, abort-on-budget path, cancellation path — each with a passing trace inspection showing the exact expected `policy.decision` sequence.
- No test in this phase ever hangs (all have explicit timeouts); no unhandled promise rejection under any injected fault.

## Demo

Run a full task headed (visible browser) against the fixture site using the local Ollama model end-to-end: goal in, browser visibly drives itself through login → search → add to cart, pauses visibly at checkout awaiting approval, resumes on approval, completes. This is the first true "the agent worked" demo of the project.

## Review Checklist

- Is there exactly one failure-handling code path, or did failure handling leak into multiple ad hoc places? (Must be exactly one.)
- Does `decidePolicy` have any branch not covered by a test? (Must be zero.)
- Can budgets ever be bypassed by any action type, including `ask_human` and `extract`? (Must be no — verify explicitly.)
- Is the Orchestrator provably ignorant of _how_ Perception/Executor/Verifier/Reasoning do their jobs — i.e., could any of the four be swapped for a totally different implementation without touching Orchestrator code? (Must be yes — this is the payoff of the whole boundary discipline.)

---

# PHASE 8 — EMBEDDABILITY LAYER (API Server + Widget SDK + Demo Host + Live View)

## Objective

Expose the Orchestrator over HTTP/SSE as a narrow embeddability contract; build a small embeddable client widget; build a minimal demo host page; add live screenshot streaming so an observer can watch the agent work in real time.

## Why this phase exists

"Embeddable" is a stated project goal and a first-class non-functional concern (portability, narrow interface). This phase is intentionally thin — it is a boundary/adapter layer, not new business logic; all real logic already exists in Orchestrator.

## Deliverables

`packages/server`: Fastify app wiring config → SafetyPolicy → Orchestrator; REST + SSE endpoints; rate limiting; static hosting of built widget/viewer/demo-host assets.
`packages/widget`: Preact-based embeddable component (`<AgentWidget goalPlaceholder .../>` conceptually) + a vanilla script-tag entry point wrapping it.
`apps/demo-host`: a minimal page embedding the widget, pointed at the fixture site by default.

## Repository changes

Adds `packages/server/*`, `packages/widget/*`, `apps/demo-host/*`.

## APIs

```
POST   /api/tasks
  body: { goal: string; startUrl: string }
  200:  { taskId: string }
  400:  { error: "invalid_goal" | "domain_not_allowed" }

GET    /api/tasks/:id/events        (SSE stream)
  events: "trace" (TraceEvent), "status" ({status: TaskStatus}), "screenshot" ({dataUrl, timestamp}), "awaiting_approval" ({reason, proposedAction})

POST   /api/tasks/:id/approve
  body: { approved: boolean; note?: string }
  200:  { ok: true }
  409:  { error: "task_not_awaiting_approval" }

POST   /api/tasks/:id/cancel
  200:  { ok: true }

GET    /api/tasks/:id
  200:  TaskContext (sanitized — no internal browser handles)

GET    /api/tasks/:id/trace
  200:  TraceEvent[]
```

All request/response bodies validated against Zod schemas from `core`; validation failures return structured `{ error, details }`, never a raw 500.

## Data Structures

HTTP-facing DTOs are thin projections of `core` types — no new domain concepts introduced at this layer, deliberately (the boundary should not accumulate its own logic).

## UI

**Widget** (embedded in host page): goal input box + start button; live step feed (renders each `trace` SSE event as a human-readable line: "Deciding next action for: 'Search for wireless mouse'... → click 'Search' button"); live screenshot pane (updates on `screenshot` events); an approval modal triggered by `awaiting_approval` events with Approve/Deny buttons; a terminal status banner (success/failure/cancelled) with a link to the full trace viewer.

**Demo host app**: single page, goal input pre-filled with an example task, widget embedded via the same public integration path a third party would use (dogfooding the actual SDK, not a special internal build).

**State management:** widget holds a small local state machine (`idle → running → awaiting_approval → done`) driven purely by SSE events — no client-side polling, no duplicated business logic (mirrors "policy lives in one place" principle from Phase 7).

## Backend

`server` is purely an adapter: HTTP request → validated DTO → `OrchestratorPort` call → SSE bridge of `subscribe()` callback → response. Rate limiting (in-memory token bucket per IP) applied to `POST /api/tasks` to protect a public demo deployment from abuse (NFR: cost containment for a publicly reachable instance).

**Live screenshot streaming:** after every `perception.captured` and `action.executed` trace event, the server additionally captures a JPEG screenshot (via the already-open Playwright page) and emits it as a `screenshot` SSE event — reuses the existing browser handle, adds negligible overhead, and is the single highest-ROI feature for demo/interview impact identified in this review.

## AI

None new — this phase is pure plumbing around Phase 7.

## Browser Automation

None new — server holds and manages the Playwright browser/page lifecycle per task (one context per task, closed on task terminal state), a responsibility that must live somewhere and belongs here (the boundary between the process-level browser resource and the pure control logic in Orchestrator).

## Testing

Integration tests: full HTTP flow using `supertest`-style requests against a running server instance with `ScriptedFakeProvider` — start task, consume SSE stream, assert expected event sequence, approve a gated step via HTTP, assert task completes; cancel mid-flight via HTTP, assert browser context is cleaned up (no orphaned processes — explicitly tested via process/handle count assertions); rate-limit test (N+1th request within the window rejected with 429).

Widget tests: component tests (render, simulate SSE events via a mocked EventSource, assert UI reflects state transitions correctly) — no real server needed.

## Acceptance Criteria

- A host page can start a task, observe live progress and screenshots, approve a gated action, and see completion — entirely via the public contract, with zero direct access to internal Orchestrator/browser objects.
- Cancelling a task always results in the underlying browser context being closed within a bounded time (no resource leak).
- Rate limiting demonstrably protects the `/api/tasks` endpoint.

## Demo

Open `apps/demo-host` in a real browser, type a goal, watch the live step feed and live screenshot pane update in real time, get prompted to approve the checkout step, click Approve, watch it finish — this is the flagship demo of the entire project and should be the GIF/video in the README.

## Review Checklist

- Does the widget contain any business logic that duplicates Orchestrator policy? (Must be no.)
- Can a third party integrate the widget without reading server source code — is the contract fully specified by the API section above? (Must be yes.)
- Is there any code path where a task's browser context is not eventually closed? (Must be provably no — test explicitly.)

---

# PHASE 9 — EVALUATION HARNESS / BENCHMARK SUITE

## Objective

A fixed, versioned set of ~20 tasks against the fixture site, each with an automatically checkable success condition, run automatically to produce reliability metrics over time.

## Why this phase exists

"Reliability" is the #1 ranked priority from Phase 1 and cannot be claimed credibly without a standing, reproducible measurement — this converts a design principle into a demoable, trackable number, directly modeled on published agent-benchmark methodology (WebArena/Mind2Web-style evaluation), which is highly legible to any technical interviewer.

## Deliverables

`packages/eval`: task definitions (goal, startUrl, structural success-check function), a runner that executes each task via the real Orchestrator against a configurable `REASONING_PROVIDER`, and a report generator (JSON + human-readable markdown summary).

## Repository changes

Adds `packages/eval/*`, `.github/workflows/eval.yml` already scaffolded in Phase 1, now wired to actually run.

## Data Structures

```ts
interface BenchmarkTask {
  id: string;
  goal: string;
  startUrl: string;
  successCheck: (finalPageState: { url: string; snapshot: PerceptionSnapshot }) => boolean;
  category: "navigation" | "form_fill" | "search" | "transaction" | "safety_gate";
}
interface BenchmarkReport {
  provider: string;
  runAt: string;
  results: {
    taskId: string;
    passed: boolean;
    steps: number;
    replans: number;
    escalations: number;
    wallClockMs: number;
    modelCalls: number;
    failureCategory?: string;
  }[];
  successRate: number;
}
```

## APIs

CLI-only (`npm run eval -- --provider=ollama`), no HTTP endpoint needed — this is a build/CI-time tool, not a runtime feature, and adding an HTTP surface for it would be unjustified complexity.

## UI

The markdown report is the "UI" — rendered in CI job summary and committed to `docs/eval/latest-report.md` for visibility in the README (a live badge is out of scope — a committed report is sufficient and free).

## Backend

None new.

## AI

Runs against whatever real (or local) provider is configured — this is the one place live model calls are expected and budgeted for regularly, isolated deliberately from the free unit/integration test suites.

## Browser Automation

Reuses the full real stack (Perception/Executor/Verifier/Orchestrator) unmodified — the eval harness must never special-case or bypass any subsystem, or the measurement would not reflect reality.

**Task list (binding, minimum set):**
1–4: navigation/login variants (including the `/unstable` page, explicitly testing grounding robustness under structural churn).
5–8: search + result selection variants (including a distractor-heavy results page).
9–12: cart/checkout transaction flows (including one where checkout must trigger `ESCALATE`/approval — success is defined as _correctly pausing_, not completing, proving the safety gate is measured, not just the happy path).
13–16: multi-step wizard flows requiring `extract`/`variables` usage across steps.
17–20: adversarial/negative cases — a task requesting navigation to a non-allowlisted domain (success = correctly denied), a task with an intentionally impossible goal (success = clean `FAILED` with clear reason, not an infinite loop), a task exceeding step budget by design (success = clean abort).

## Testing

Meta-tests on the harness itself: a task with a known-passing `ScriptedFakeProvider` must report `passed: true`; a deliberately-broken fake provider must report `passed: false` with a populated `failureCategory` — proves the harness's own correctness before trusting its numbers against a real model.

## Acceptance Criteria

- Full suite runs end-to-end against `ScriptedFakeProvider` with 100% pass rate (proves the tasks/checks themselves are well-formed).
- Full suite runs against the configured real provider (Ollama and/or free-tier cloud) with a documented success rate ≥ 85% (SC1), committed to `docs/eval/latest-report.md`.
- `eval.yml` runs on schedule and on manual dispatch without requiring any paid credential by default (Ollama path).

## Demo

Run `npm run eval` locally, produce the markdown report, show the success-rate trend if run more than once (even a two-point trend is a legitimate demoable regression-tracking story).

## Review Checklist

- Is every `successCheck` purely structural (URL/DOM-based), never relying on the model to grade itself? (Must be yes — grading with the same class of component being graded is a methodological flaw.)
- Does the safety-gate task category actually fail the benchmark if the agent completes checkout _without_ pausing? (Must be yes — this is the single most important negative test in the whole project.)

---

# PHASE 10 — TRACE VIEWER APPLICATION

## Objective

A small standalone read-only web application that loads a task's full trace and renders a step-by-step, human-readable reconstruction of exactly what happened and why.

## Why this phase exists

Explainability (#2 ranked priority) is only real if a human can actually consume it. Raw JSON trace events satisfy the data requirement but not the demoability requirement — this phase converts data into a legible artifact, which is precisely what distinguishes this project from "an agent that logs stuff."

## Deliverables

`packages/trace-viewer`: SPA that takes a `taskId`, calls `GET /api/tasks/:id/trace`, and renders: the original goal, the plan (with version history if replanned), a scrollable timeline of steps each showing before/after screenshot thumbnails (if captured), the reasoning `rationale` text, the action taken, the verification verdict + method + evidence, and the policy decision — plus a final outcome summary with total steps/retries/replans/escalations/cost proxy.

## Repository changes

Adds `packages/trace-viewer/*`.

## APIs

Consumes the existing `GET /api/tasks/:id/trace` endpoint only — no new backend surface required (another deliberate thinness — this phase is presentation-only).

## Data Structures

Purely a rendering projection of `TraceEvent[]` — no new domain types.

## UI

Screens: a task-ID input/landing view; a timeline detail view (the core screen). Components: `PlanPanel`, `StepCard` (screenshot pair + rationale + verdict), `OutcomeSummary`. Interactions: click a step to expand full raw event payload (for power users/debugging); filter by subsystem or event type. State management: simple local state (fetched trace array + selected step index) — no global store needed, this app is small enough that introducing one would be unjustified complexity.

## Backend

None new.

## AI

None — purely a viewer of already-recorded rationale text, never calls a model itself.

## Browser Automation

None — operates on persisted data only.

## Testing

Component tests rendering a fixture trace (a hand-authored `TraceEvent[]` covering a success path, a retry path, a replan path, and an escalation path) and asserting each renders with the correct labels/verdicts/counts.

## Acceptance Criteria

- Given any completed task's ID, the viewer reconstructs a step-by-step narrative sufficient for someone who did not watch the run to understand exactly what happened and why, including every retry/replan/escalation.
- Works fully offline against a static exported trace JSON as well as live against the server (useful for including a "sample trace" in the repo for reviewers who don't want to run the full stack).

## Demo

Load a trace from a task that hit a retry, a replan, and an approval gate all in one run, and narrate it live in an interview purely from the viewer UI — this is the second flagship demo artifact of the project, arguably more valuable in an interview setting than the live-agent demo itself because it proves engineering rigor rather than model luck.

## Review Checklist

- Can the viewer explain a failed/aborted task as clearly as a successful one? (Must be yes — explainability of failure is the harder and more important case.)
- Does the viewer ever need to re-run anything to produce its explanation? (Must be no — pure replay from persisted data.)

---

# PHASE 11 — HARDENING, DEPLOYMENT, DOCUMENTATION

## Objective

Bring the whole system to a genuinely production-oriented, deployable, documented state.

## Why this phase exists

A portfolio project is judged as much by its packaging and documentation as by its code. This phase is not "extra polish," it is where the project's engineering-communication quality — the thing interviewers actually assess in a 45-minute conversation — is finalized.

## Deliverables

- Single Dockerfile building the server (with Chromium deps) + static widget/viewer/demo-host assets.
- `docker-compose.yml` finalized: server + optional Ollama profile.
- Full `README.md`: vision, architecture diagram, quickstart, demo GIF, links to trace-viewer sample, eval report, ADR index.
- `docs/architecture/overview.md` finalized, matching the as-built system exactly (no drift from the design docs).
- All ADRs finalized and cross-linked.
- Load/resilience pass: verify graceful behavior under a killed browser process, an unreachable model provider, a corrupted SQLite file on boot (must fail fast with a clear error, never silently corrupt further).
- Optional live hosted demo deployed to a free-tier scale-to-zero platform, clearly caveated in the README.

## Repository changes

Root-level files finalized; no new packages.

## APIs / Data Structures / UI / Backend / AI / Browser Automation

No new functionality — this phase is stabilization, documentation, and deployment only. Any bug found here is fixed in its owning package, not patched over at this layer.

## Testing

Full regression run of every prior phase's test suite; a fresh-machine test (`git clone` → `docker compose up` → working demo, timed, target < 5 minutes); dependency-cruiser and lint run clean with zero warnings suppressed.

## Acceptance Criteria

- SC1–SC6 (Phase 0) all independently verified and stated as met (or explicitly and honestly documented as partially met, with reasoning) in the README.
- A stranger can go from `git clone` to a working local demo in under 5 minutes with zero paid account required.
- CI is green on `main`, `eval.yml`'s last scheduled run is linked from the README.

## Demo

The final, polished version of the Phase 8 and Phase 10 demos, recorded as GIFs/short video and embedded in the README — this is the artifact that gets shared in a resume/portfolio link.

## Review Checklist

- Does the README's architecture description match the actual code exactly, with no aspirational claims about unbuilt features? (Must be yes — false claims are worse than no claims in this context.)
- Is every out-of-scope decision from Phase 0 still honestly listed as out-of-scope, rather than quietly half-implemented? (Must be yes.)
- Could a Principal Engineer read this repository's ADRs and understand every non-obvious decision without asking the author? (This is the actual bar.)

---

# Closing Note

This roadmap deliberately produces **twelve packages mapping 1:1 to a six-subsystem architecture**, each independently testable, each with a narrow and enforced boundary, each earning its place against the same test used in the original architecture review: _does removing this lose a real capability, or merely remove a file?_ Nothing here is speculative infrastructure — there is no queue, no multi-tenant data model, no plugin marketplace, no distributed deployment topology, because none of those are required to demonstrate the engineering thesis, and each would dilute the portfolio's actual claim.

The project's defensible, interview-ready narrative is singular and consistent end to end:

> _"I treated a large language model as an unreliable, non-deterministic dependency, and built the surrounding system the way you'd build any fault-tolerant distributed system around an unreliable dependency — isolation, verification, bounded retries, explicit safety gating, and full observability — and I can show you the trace of exactly why it did what it did, every single time."_

**Stopping here per your instructions.** This is the complete phase-by-phase implementation roadmap for Hermes Agent. Awaiting your review/approval before any further detail (e.g., literal prompt text, exact schema files, or first-line-of-code work) is produced.
