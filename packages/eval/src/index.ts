/**
 * @eai/eval public surface.
 *
 * Phase 1: typed marker only. The actual subsystem logic lands in the spec-defined phase.
 * See packages/eval/README.md for "owns" / "does not own" boundaries.
 */

export const PACKAGE_MARKER = "@eai/eval" as const;
export const PACKAGE_VERSION = "0.0.0" as const;
