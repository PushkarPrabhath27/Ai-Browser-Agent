/**
 * Cross-subsystem identifier types. Every ID that crosses a package boundary
 * is typed here so that, e.g., a function expecting `TaskId` cannot be passed
 * a `SnapshotId` or a raw string by accident.
 *
 * Phase 2 adds `PlanId`, `IntentId`, `StepId` and any further IDs as new schemas.
 *
 * See ADR-0002 for the nominal-typing rationale.
 */
import type { Brand } from "./brand.js";

/** Stable identifier of a single agent task. Allocated by Orchestrator at task start. */
export type TaskId = Brand<string, "TaskId">;

/** Stable identifier of a single PerceptionSnapshot. Unique within the trace. */
export type SnapshotId = Brand<string, "SnapshotId">;

/** Stable identifier of a single TraceEvent. */
export type EventId = Brand<string, "EventId">;

/**
 * Allocate a TaskId from a raw string. Use ONLY at trust boundaries:
 *   - the Orchestrator when accepting a new goal
 *   - the Trace package when constructing foreign imports (none in v1)
 *   - test fixtures
 *
 * Do not use these freely. The brand's purpose is to make accidental swap
 * impossible at compile time. The cast widens responsibility deliberately.
 */
export const taskId = (raw: string): TaskId => raw as TaskId;
export const snapshotId = (raw: string): SnapshotId => raw as SnapshotId;
export const eventId = (raw: string): EventId => raw as EventId;
