# `@eai/demo-host`

## Owns

- A minimal page that embeds the widget via the **public** integration path.
- Dogfoods the SDK: this app uses the same `<script>` tag and bundle any third-party host would.

## Explicitly does NOT own

- Widget implementation → `@eai/widget`.
- Backend, SSE, or any transport → `@eai/server`.
- Custom UI extensions for the agent itself.

## Phase 1 state

Static HTML placeholder served by opening the file or by pointing a static server at `apps/demo-host/`. Full build config + widget integration lands in Phase 8.

By Phase 8, this app points at the fixture site by default (`http://localhost:3001/` or whatever Phase 2 specifies) so a developer running `npm run dev` can demo the agent end-to-end against deterministic content.
