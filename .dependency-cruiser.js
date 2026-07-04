// dependency-cruiser configuration.
// Encodes the architectural boundary table from docs/architecture/original-spec.md (Phase 1).
// Enforces NFR8: "architectural module boundaries are enforced by static dependency analysis in CI, not convention alone".
//
// Boundary semantics:
// - Source is an entire package (prefix match: `^packages/<name>/`).
// - Target is any `packages/`-rooted path EXCEPT the source's own package and EXCEPT the
//   explicit allowlist for that source.
// - Intra-package references (e.g. test importing its own package's index.ts) are NOT forbidden.
// - Path-only filtering (no `dependencyTypes`) because npm workspaces resolve internal
//   packages as `undetermined`, not `npm`; the rule must fire unambiguously.
//
// ADR-0001 commits us to npm workspaces; ADR-0003 commits us to no local Docker; neither
// alters these rules. As packages gain real content (Phase 2+), per-package allowlists tighten.
//
/** @type {import('dependency-cruiser').IConfiguration} */

/**
 * Build the forbidden-target pattern for a source package: any `packages/<other>/` where
 * `<other>` is NOT in `allowed`, NOT the source name. The negative-lookahead is anchored
 * on the package directory boundary (`/`) so a source name like `core` does not match
 * the unrelated package `coreaux`.
 */
function forbiddenTargetPattern(sourceName, allowed) {
  const allowlist = [sourceName, ...allowed].map((n) => `(?:${n}(?:/|$))`).join("|");
  return `^packages/(?!(?:${allowlist}))[^/]+/`;
}

export default {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies are forbidden; package boundaries must be a DAG.",
      from: {},
      to: { circular: true },
    },
    // no-orphans: NOT enabled in Phase 1 because type-only modules (brand.ts, ids.ts) exist
    // exclusively to be re-exported from a package's index.ts and depcruiser's orphan
    // heuristic treats them as unreachable. Phase 2 re-enables this rule after each
    // package has at least one substantive source file; the threshold for re-enabling
    // is documented in the corresponding phase plan.

    {
      name: "core-no-internal-deps",
      severity: "error",
      comment: "core must not depend on any other internal package.",
      from: { path: "^packages/core/" },
      to: { path: forbiddenTargetPattern("core", []) },
    },
    {
      name: "trace-only-core",
      severity: "error",
      comment: "trace may depend only on core.",
      from: { path: "^packages/trace/" },
      to: { path: forbiddenTargetPattern("trace", ["core"]) },
    },
    {
      name: "perception-only-core",
      severity: "error",
      comment: "perception may depend only on core (Reasoning/Orchestrator forbidden).",
      from: { path: "^packages/perception/" },
      to: { path: forbiddenTargetPattern("perception", ["core"]) },
    },
    {
      name: "executor-only-core",
      severity: "error",
      comment: "executor may depend only on core (reasoning/verifier forbidden).",
      from: { path: "^packages/executor/" },
      to: { path: forbiddenTargetPattern("executor", ["core"]) },
    },
    {
      name: "verifier-only-core-and-reasoning",
      severity: "error",
      comment:
        "verifier may depend on core and reasoning (model-assisted fallback only). All other internal packages are forbidden.",
      from: { path: "^packages/verifier/" },
      to: { path: forbiddenTargetPattern("verifier", ["core", "reasoning"]) },
    },
    {
      name: "reasoning-only-core",
      severity: "error",
      comment: "reasoning may depend only on core.",
      from: { path: "^packages/reasoning/" },
      to: { path: forbiddenTargetPattern("reasoning", ["core"]) },
    },
    {
      name: "orchestrator-may-not-depend-on-server",
      severity: "error",
      comment:
        "orchestrator must not depend on server (server depends on orchestrator, not vice versa).",
      from: { path: "^packages/orchestrator/" },
      to: { path: "^packages/server/" },
    },
    {
      name: "widget-only-core",
      severity: "error",
      comment:
        "widget may depend only on core. Integration with the server happens via HTTP/SSE only.",
      from: { path: "^packages/widget/" },
      to: { path: forbiddenTargetPattern("widget", ["core"]) },
    },
    {
      name: "trace-viewer-only-core",
      severity: "error",
      comment:
        "trace-viewer may depend only on core. It calls the server over HTTP at runtime; never imports it.",
      from: { path: "^packages/trace-viewer/" },
      to: { path: forbiddenTargetPattern("trace-viewer", ["core"]) },
    },
    {
      name: "eval-may-not-depend-on-server",
      severity: "error",
      comment: "eval must not depend on server (CLI/runtime harness, not HTTP).",
      from: { path: "^packages/eval/" },
      to: { path: "^packages/server/" },
    },
    {
      name: "fixture-site-is-leaf",
      severity: "error",
      comment: "fixture-site must not depend on any internal package.",
      from: { path: "^packages/fixture-site/" },
      to: { path: "^packages/(?!fixture-site(?:/|$))[^/]+/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: { collapsePattern: "node_modules/[^/]+" },
    },
  },
};
