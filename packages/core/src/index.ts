/**
 * @eai/core public surface.
 *
 * Phase 1 contents:
 *   - branded ID types and constructors
 *   - package marker (for cross-package lets-import checks)
 *
 * Phase 2 will add: error taxonomy, Action vocabulary, Plan/Intent types,
 * PerceptionSnapshot/ElementNode, VerificationResult, TraceEvent, SafetyPolicy,
 * and the Zod schemas that produce TS types via `z.infer<>`.
 */

export type { Brand } from "./brand.js";
export type { TaskId, SnapshotId, EventId } from "./ids.js";
export { taskId, snapshotId, eventId } from "./ids.js"; // re-export ID constructors

/**
 * Unique-to-this-package literal. Used by tests and tooling to detect that the
 * package's *real* public surface is being re-exported, not a placeholder.
 *
 * If you ever find yourself wiring `export const PACKAGE_MARKER = "..."` in
 * multiple places, one of them is wrong — markers are unique per package.
 */
export const PACKAGE_MARKER = "@eai/core" as const;

/** Phase 1 version. Per-package version is bumped when that package's contract changes. */
export const PACKAGE_VERSION = "0.0.0" as const;

// Phase 2 placeholder (commented to keep the file symmetric; replaced with real exports when schemas land):
// export type { Action, ElementNode, PerceptionSnapshot, Intent, Plan, VerificationResult, TraceEvent, SafetyPolicy } from "./schemas/index.js";
