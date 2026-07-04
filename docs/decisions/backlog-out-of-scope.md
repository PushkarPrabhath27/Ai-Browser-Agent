# Out-of-Scope Backlog

Two sources feed this list:

1. Things the original spec (§Phase 0 Out-of-Scope) explicitly removes.
2. Things Hermes Agent has considered and decided _not_ to implement in _any_ phase — either because the spec already said no, or because the engineering-thesis test ("does removing this lose a real capability, or just remove a file?") returns "just remove a file."

Every entry: a one-line justification for exclusion, per the spec's anti-drift rule.

---

## From spec §Phase 0 — explicit and permanent

| Item                                                         | Justification for exclusion                                                                                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Multi-agent orchestration                                    | Spec's single-agent thesis; introducing a second agent doubles the verification surface without serving the engineering claim.                                                                               |
| Persistent cross-session memory / RAG                        | Adds unbounded context growth and a new storage failure mode. The Orchestrator's history-bound summary (Phase 7) is the bounded equivalent.                                                                  |
| Vision-first pixel grounding                                 | Excluded as a _primary_ path. Accessibility-tree perception is faster, more stable, and avoids research-grade vision grounding. Vision is allowed only as an optional later fallback for canvas-heavy sites. |
| General-purpose workflow / automation engine                 | Different thesis entirely; would dilute the agent-as-component narrative.                                                                                                                                    |
| Enterprise features (billing, orgs, multi-tenant dashboards) | No SaaS being built; spec §Non-Goals excludes this.                                                                                                                                                          |
| Horizontal scaling / queue infrastructure                    | Single-instance SQLite is sufficient. Spec NFR7 (portability) explicitly favors this.                                                                                                                        |
| Mobile app automation                                        | Browser-automation engines for mobile are a separate research problem; out-of-scope is permanent.                                                                                                            |
| Non-Chromium engines as v1 requirement                       | Spec §Dependency List: Playwright supports multi-engine, but multi-engine coverage is not a v1 need.                                                                                                         |

## Amplified by Phase 1 hardware constraint discussion

| Item                                                                                                                  | Justification for exclusion                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local Docker / Docker Desktop as a local dev requirement                                                              | Disk/RAM footprint incompatible with contributor's machine. CI/deploy may still use Docker via container-on-CI-runner. See ADR-0003.                  |
| Ollama as a default runtime path                                                                                      | Requires 4-8GB local weight download per model. Adapters are still implemented for completeness; the adapter is opt-in only. See ADR-0005.            |
| Firefox/WebKit browser binaries                                                                                       | Single-engine (Chromium) is sufficient for v1. Saves ~500MB-1GB in Playwright installation.                                                           |
| Nx / Turborepo                                                                                                        | Workspace size doesn't justify it. npm workspaces alone is the documented fallback. See ADR-0001.                                                     |
| Telemetry / analytics SaaS of any kind                                                                                | Privacy-by-default conflicts with the embeddable component's trust contract. See A1.9.                                                                |
| Material node_modules growth, binary asset pulls, or local daemons beyond SQLite+Node+Chromium without prior sign-off | Disk footprint is a first-class NFR per Phase 1 conversation; on this contributor's machine, the next unexpected multi-GB download is a blocking bug. |

## Hermes-considered and consciously rejected

| Item                                                        | Why considered                           | Why rejected                                                                                                                                              |
| ----------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint v8 (to keep `.eslintrc.cjs` format)                  | Backwards-compatible config file format. | Deprecated; would force migration inside project lifetime. See A1.10. Default to flat config.                                                             |
| Husky pre-commit (in addition to pre-push)                  | Catch bad messages earlier.              | Slows inner loop; pre-push catches everything we actually need.                                                                                           |
| Persistent cross-session plan memory                        | Useful UX feature.                       | Violates bounded-context principle; no project capability requires it.                                                                                    |
| Adapter for browserless.io / similar hosted browsers        | Offload the Chromium process.            | Cloud dependency conflicts with NFR7 / SC4.                                                                                                               |
| Postgres for trace storage in Phase 1                       | Concurrent writes between phases.        | Spec says SQLite first, Postgres as migration path. Premature swap would violate simplicity.                                                              |
| Generic React (over Preact) for the widget bundle           | Larger ecosystem.                        | Preact is ~3KB; bundle size is the whole point of an embeddable widget. Spec §Dependency Table: swap to React "trivially if bundle size stops mattering." |
| Built-in benchmark tUI / web dashboard for the eval harness | Better showcase.                         | Adds a non-trivial UI surface to a CLI tool. Report-as-markdown is sufficient and free.                                                                   |
