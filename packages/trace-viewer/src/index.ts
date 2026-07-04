/**
 * @eai/trace-viewer public surface.
 *
 * Phase 1: typed marker only. The actual subsystem logic lands in the spec-defined phase.
 * See packages/trace-viewer/README.md for "owns" / "does not own" boundaries.
 */

export const PACKAGE_MARKER = "@eai/trace-viewer" as const;
export const PACKAGE_VERSION = "0.0.0" as const;
