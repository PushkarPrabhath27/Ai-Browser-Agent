/**
 * @eai/executor public surface.
 *
 * Phase 1: typed marker only. The actual executor logic lands in Phase 4 per spec.
 * See packages/executor/README.md for "owns" / "does not own" boundaries.
 */

export const PACKAGE_MARKER = "@eai/executor" as const;
export const PACKAGE_VERSION = "0.0.0" as const;
