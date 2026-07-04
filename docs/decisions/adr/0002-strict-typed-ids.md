# ADR-0002 — Strict typed IDs via branding (nominal types)

- Status: Accepted (Phase 1; foundational primitive used Phases 2+)
- Date: 2025-01

## Context

The system passes three recurring identifier types across every subsystem boundary: `taskId`, `snapshotId`, `eventId`. Many internal helpers also introduce shortIds. Without type enforcement these become stringly-typed and a function like `trace.record(event, taskId)` can be silently swapped with `trace.record(taskId, event)` — both compile, both "run", both corrupt the trace.

Every ADR-worthy identifier in this codebase should be branded.

## Decision

Use TypeScript's nominal-typing pattern via a `Brand<K, T>` helper in `@eai/core/src/brand.ts`. Every cross-boundary ID type is a `Brand<string, "...">`. The brand is a phantom type that exists only in the type system; it does not alter runtime representation. Crossing a trust boundary casts via an explicit constructor (`taskId(raw)`), which forces a deliberate decision at the boundary.

## Alternatives considered

- **No branding**: rejected. Stringly-typed IDs were the classic source of "the wrong task ID got logged" bugs in agent systems I've read about. Cost of branding is one helper file; cost of the bug class is nonzero and unbounded.
- **Branded classes with runtime checks (e.g., `class TaskId { constructor(s: string) { validate } }`)**: rejected. Adds runtime overhead and serialized-shape complications (Zod expects JSON-compatible primitives).
- **Branded numbers (UUIDs)**: rejected at this stage. The spec hands us `string` IDs throughout. Switching to numeric IDs would upcast all schemas; defer until a measured need appears.
- **Branded with a tagged-template literal type (e.g., `& \`task-${string}\`)`)**: rejected. Too restrictive — not every ID generator will produce that prefix.

## Consequences

- `trace.record(event, wrongId)` is a compile-time error.
- The `Brand<K, T>` helper is itself a one-line immutable type and a single explicit cast point. No runtime overhead, no extra dependencies.
- `z.infer<>` derivations of branded-string schemas are pass-through; JSON-in/JSON-out production code stays simple. This is intentional — branding is a _compile-time_ affordance, not a wire-format concern.
- Future schemas in `core` (Phase 2) will use these primitives; this ADR pre-paves them.

## Compliance

- All code in `packages/core/src/brand.ts` is type-only. Zero runtime cost.
- Every new ID type follows the `Brand<string, "...">` pattern unless this ADR is superseded.
