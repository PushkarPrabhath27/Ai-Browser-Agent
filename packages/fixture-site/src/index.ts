/**
 * @eai/fixture-site public surface.
 *
 * Phase 1: typed marker + the placeholder HTTP server module. The dev entry
 * point is `src/main.ts` (boots the server when run via `npm run dev`).
 *
 * Phase 2 adds: per-page route handlers (login, search, catalog, product, cart,
 * checkout, wizard, unstable — with the `/unstable` page varying non-semantic
 * attributes on every load while accessibility names remain role-stable).
 */

import { PACKAGE_MARKER, PACKAGE_VERSION } from "./server.js";
export { startFixtureSite } from "./server.js";

export { PACKAGE_MARKER, PACKAGE_VERSION };
