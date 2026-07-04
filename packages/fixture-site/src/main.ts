/**
 * Dev entrypoint for @eai/fixture-site.
 *
 * Phase 1: boots the placeholder HTTP server with sensible defaults from env.
 * Phase 2: same entry point, expanded handler routes.
 *
 * Run via `npm run dev` (root) which uses concurrently to start this alongside
 * the agent server.
 */

import { startFixtureSite } from "./server.js";

const port = Number.parseInt(process.env.FIXTURE_SITE_PORT ?? "3001", 10);
const host = process.env.FIXTURE_SITE_HOST ?? "127.0.0.1";

startFixtureSite(port, host);
