/**
 * Marker test for @eai/reasoning.
 *
 * Phase 1: confirms the public surface compiles and exports the unique marker.
 * Phase-N: replaced by real subsystem tests as business logic lands.
 */

import { describe, it, expect } from "vitest";
import { PACKAGE_MARKER, PACKAGE_VERSION } from "../index.js";

describe("@eai/reasoning — public surface (Phase 1)", () => {
  it("exports the unique package marker", () => {
    expect(PACKAGE_MARKER).toBe("@eai/reasoning");
  });

  it("exports the package version", () => {
    expect(PACKAGE_VERSION).toBe("0.0.0");
  });
});
