/**
 * Tests for the core package public surface.
 *
 * These tests are adversarial against Phase 2 work too: if anyone imports
 * a Phase 2 type that does not yet exist, this file should be updated to
 * match. Tests are the gate, not docs.
 */

import { describe, it, expect } from "vitest";
import {
  PACKAGE_MARKER,
  PACKAGE_VERSION,
  taskId,
  snapshotId,
  eventId,
  type TaskId,
  type SnapshotId,
  type EventId,
  type Brand,
} from "../index.js";

describe("@eai/core — public surface", () => {
  it("exports the unique package marker", () => {
    expect(PACKAGE_MARKER).toBe("@eai/core");
  });

  it("exports the package version", () => {
    expect(PACKAGE_VERSION).toBe("0.0.0");
  });

  it("exports id constructors that brand strings", () => {
    const tid = taskId("abc");
    const sid = snapshotId("def");
    const eid = eventId("ghi");

    expect(typeof tid).toBe("string");
    expect(typeof sid).toBe("string");
    expect(typeof eid).toBe("string");
  });

  it("branded IDs are nominal at the type level", () => {
    // By construction these annotations should compile. Cross-assignment should NOT.
    // We rely on the type checker for the negative case; this test just constructs
    // and confirms the types are reachable as values.
    const tid: TaskId = taskId("a");
    const sid: SnapshotId = snapshotId("b");
    const eid: EventId = eventId("c");

    expect([tid, sid, eid]).toEqual(["a", "b", "c"]);
  });

  it("Brand<K, T> is a structural compile-time construct", () => {
    // Runtime: brand contributes nothing observable; the brand type itself is
    // a phantom. The point is that the *type* is preserved across the boundary.
    type Lit = Brand<"hello", "Marker">;
    // We don't assert anything at runtime; the existence of this declaration
    // is the test. If `Brand` is ever clobbered to e.g. a class, this file
    // won't compile.
    const _phantom: Lit = "hello" as Lit;
    expect(_phantom).toBe("hello");
  });
});
