# Architecture Overview

> **Stub.** The architecture overview doc is written as the as-built system stabilizes — primarily after Phase 7 (Orchestrator + closed control loop) and Phase 8 (Embeddability layer). Writing it in Phase 1 would describe aspirational behavior, not actual code, and is exactly the kind of drift the spec calls out in Phase 11's Review Checklist ("no aspirational claims about unbuilt features").

## What to expect when this lands

- Six-subsystem model: Reasoning, Perception, Executor, Verifier, Orchestrator, Trace.
- One ASCII or mermaid diagram of the unidirectional dependency DAG (matches `packages/*` dependency table).
- For each subsystem: a paragraph each on what it owns, what it explicitly does NOT own, and the trace events it emits.
- A short failure-handling section showing the _single_ failure path through `decidePolicy`.
- Cross-linked ADRs.
