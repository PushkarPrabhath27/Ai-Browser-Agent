/**
 * @eai/fixture-site — Phase 1 placeholder server.
 *
 * Purpose: prove that `npm run dev` (root) can boot the server + fixture-site
 * pair as two concurrent Node child processes, via `concurrently`. The actual
 * multi-page test sandbox (login / search / catalog / cart / checkout / wizard
 * / unstable) lands in Phase 2 per spec §Phase 2 §Browser Automation.
 *
 * Spec placeholders for Phase 1:
 *   - Single trivial route at `/` returning a 200 page that announces "Phase 2
 *     lands full content" — sufficient for `npm run dev` to smoke-test the
 *     two-process boot end-to-end today.
 *   - Port chosen to avoid collision with the agent server (which Phase 8 wires
 *     to port 3000). Phase 2 may standardize this; for now 3001 is the
 *     fixture-site default.
 *
 * Server implementation: plain Node `http.createServer`, no framework. Phase 2
 * may upgrade if needed (Fastify / Express / etc.); the spec asks for
 * server-rendered HTML so a framework is optional.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";

const PACKAGE_MARKER = "@eai/fixture-site" as const;
const PACKAGE_VERSION = "0.0.0" as const;

export { PACKAGE_MARKER, PACKAGE_VERSION };

const PLACEHOLDER_BODY = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Fixture Site — Phase 1 placeholder</title>
    <style>
      :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { margin: 0; padding: 3rem; max-width: 40rem; margin-inline: auto; line-height: 1.55; }
      h1 { font-size: 1.5rem; }
      .badge { display: inline-block; padding: 0.25rem 0.6rem; border: 1px solid currentColor;
               border-radius: 999px; font-size: 0.85rem; opacity: 0.85; }
      code { font-family: ui-monospace, SFMono-Regular, monospace; }
      .small { font-size: 0.875rem; opacity: 0.8; }
    </style>
  </head>
  <body>
    <h1>Fixture Site <span class="badge">Phase 1 placeholder</span></h1>
    <p>
      This is a deterministic test sandbox used as the agent's runtime target.
      In Phase 1 it returns this single placeholder page so that
      <code>npm run dev</code> can boot both the agent server and the fixture
      site simultaneously and prove end-to-end process orchestration.
    </p>
    <p class="small">
      Full content lands in Phase 2 per spec: <code>/login</code>,
      <code>/search</code>, <code>/catalog</code>, <code>/product/:id</code>,
      <code>/cart</code>, <code>/checkout</code>, <code>/wizard</code>,
      and <code>/unstable</code> (the structural-churn grounding test page).
      See <code>docs/architecture/original-spec.md</code> §Phase 2.
    </p>
    <p class="small">Loaded package: <code>${PACKAGE_MARKER}@${PACKAGE_VERSION}</code></p>
  </body>
</html>`;

function handle(_req: IncomingMessage, res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(PLACEHOLDER_BODY);
}

const server = createServer(handle);

export function startFixtureSite(port: number = DEFAULT_PORT, host: string = DEFAULT_HOST): void {
  server.listen(port, host, () => {
    console.warn(
      `[fixture-site] listening on http://${host}:${String(port)} (${PACKAGE_MARKER}@${PACKAGE_VERSION})`,
    );
  });
}

// Graceful shutdown so `concurrently`'s Ctrl+C propagates cleanly and does
// not leave orphan Node processes around.
function shutdown(signal: NodeJS.Signals): void {
  console.error(`[fixture-site] received ${signal}, shutting down`);
  server.close((err) => {
    if (err) {
      console.error("[fixture-site] error during shutdown", err);
      process.exitCode = 1;
    }
    process.exit(process.exitCode ?? 0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
