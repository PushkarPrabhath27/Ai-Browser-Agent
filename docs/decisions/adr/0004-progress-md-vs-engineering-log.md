# ADR-0004 — Two continuity files: `.hermes/PROGRESS.md` and `docs/decisions/engineering-log.md`

- Status: Accepted (Phase 1; Hermetic-state decision)
- Date: 2025-01

## Context

The spec mandates `docs/decisions/engineering-log.md` as the running log that Hermes Agent appends to per phase. That file answers: "what did the Reviewer verify in this phase?"

A separate continuity problem is not addressed by this single file: if an agent session crashes mid-phase, what does the next session — or a human reviewer — read to resume within one tool call and zero guessing? The engineering-log file is structured for per-phase review output, not for session-spanning incremental hand-off. Forcing both into one file would either dilute its structure or be lossy.

## Decision

Two files, two jobs, deliberately non-overlapping:

| File                                | Purpose                                                                                                                     | Audience                                                                                    | Cadence                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `docs/decisions/engineering-log.md` | Per-phase Reviewer output: which items from the spec's Review Checklist were verified, which tests prove them, any residue. | Spec reviewers, architects.                                                                 | Appended once at end of phase.                                |
| `.hermes/PROGRESS.md`               | Session-spanning continuity log: timestamp, what changed, why, what's left, exact resume command.                           | Next agent session (Hermes or otherwise), the project owner resuming after an interruption. | Appended after every meaningful action, not just phase gates. |

The `.hermes/` directory is the agent's local scratch — it is committed to the repo (not gitignored) so that the continuity log is itself durable across sessions and agent restarts. This is a deliberate choice: the cost of committing small prose is negligible; the cost of losing continuity context is real.

## Alternatives considered

- **Single file (engineering-log.md only)**: rejected. It over-clutters a per-phase review document with session-control details reviewers don't need (exact shell commands, in-progress notes, scratch reasoning).
- **A separate `RESUME.md`**: rejected as the primary name — it under-describes its actual purpose. `PROGRESS.md` is what it contains.
- **Telemetry / context-stream via Hermes' own memory tool only**: rejected. Memory is injected into the agent's stable-but-not-durable context and is invisible to reviewers; it does not survive a session reset unless explicitly persisted, and even then the owner cannot read it.
- **Store in `docs/decisions/sessions/NN.md` (one file per session)**: rejected. Generates one file per session forever; the cumulative log is fragmented. A single append-only file is simpler and grep-friendly.

## Consequences

- A reviewer skimming the spec's Review Checklist doesn't have to wade through in-progress session telemetry.
- A crashed agent session is recoverable from `.hermes/PROGRESS.md` alone: read last entry → resume from "what's left" → execute "exact resume command".
- Both files are committed (not gitignored): they are part of the project's permanent record. Each entry should be small enough that total repo size impact stays negligible.
- This ADR itself is the explanation of why the two files exist. If a future reader questions the duplication, point them here.

## Compliance

- `.hermes/PROGRESS.md` is created in Phase 1 with an initial entry. Every subsequent phase adds entries; this is itself a Review Checkpoint item per phase.
- `engineering-log.md` is appended on phase completion by the Reviewer role only, not the Implementer.
- No third, fourth, or fifth continuity file gets created without amending this ADR.
