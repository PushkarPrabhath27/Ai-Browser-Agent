/**
 * Smoke test for @eai/fixture-site (Phase 1).
 *
 * Phase 1 is intentionally minimal: this file asserts only that the package's
 * public surface exports the typed marker + the `startFixtureSite` function
 * with the expected signature.
 *
 * HTTP integration tests (boot the server, fetch placeholder, verify route
 * structure) land in Phase 2 alongside the real per-page handlers. Doing them
 * here would test a placeholder against mocks of its own implementation
 * surface — exactly the kind of decoration test the spec asks us to avoid.
 */

import { describe, it, expect } from "vitest";
import { PACKAGE_MARKER, PACKAGE_VERSION, startFixtureSite } from "../index.js";

describe("@eai/fixture-site — public surface (Phase 1)", () => {
  it("exports the unique package marker", () => {
    expect(PACKAGE_MARKER).toBe("@eai/fixture-site");
  });

  it("exports the package version", () => {
    expect(PACKAGE_VERSION).toBe("0.0.0");
  });

  it("exports startFixtureSite as a function", () => {
    expect(typeof startFixtureSite).toBe("function");
    expect(startFixtureSite.length).toBeGreaterThanOrEqual(0);
  });
});
