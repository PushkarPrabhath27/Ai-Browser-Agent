# ADR-0003 — No local Docker / Docker Compose; use `concurrently` for dev orchestration

- Status: Accepted (Phase 1; amended from spec §0 default)
- Date: 2025-01

## Context

The original spec lists `docker compose up` as the primary local development command. This collides with a hard laptop-disk constraint: Docker Desktop on WSL2 routinely consumes multiple GB of disk space before a single image is built, plus non-trivial RAM and CPU overhead. The contributor does not have that disk budget available. CI/CD runners (GitHub-hosted) do — so Docker is permitted as a deploy artifact in Phase 11, but is never a local-dev requirement.

The same constraint also affects the default reasoning provider choice — see ADR-0005.

## Decision

- No `docker-compose.yml` at the repo root in Phase 1–10.
- `npm run dev` (root) uses the `concurrently` package to spawn the server and fixture-site as ordinary Node child processes (no container boundaries).
- A Dockerfile and a docker-compose file are written in Phase 11 (Hardening & Deployment) for CI builds and for self-hosters who opt into the container path. They never run locally during development or testing on this machine.
- Local development testing uses Chromium installed via `npx playwright install chromium` (single engine, not the full Firefox+WebKit+Chromium bundle).
- `.gitignore` and `.dockerignore` (this phase) pre-exclude local-only paths so that any future container build does not pull in node_modules or data accidentally.

## Alternatives considered

- **Keep Docker as primary (spec default)**: rejected on disk/footprint grounds. The spec's portability claim (SC4: zero mandatory paid dependency) is preserved; we are tightening it (zero mandatory heavyweight daemon) without changing the user-facing capability.
- **Use Node's built-in `--watch` and roll our own process supervisor**: rejected. `concurrently` is ~5KB, stable, OSS, and has logging + color + kill semantics out of the box. Rolling our own would violate the "boring code" principle.
- **Use `tmux` / detach with `&`**: rejected. Non-portable across shells (PowerShell vs bash vs zsh), leaks processes on Ctrl+C, and adds no value over `concurrently`.
- **Use systemd / Windows Service for fixture-site and server**: rejected. Massive overengineering for two long-running dev processes; also hostile to WSL ergonomics.

## Consequences

- `npm run dev` boots server + fixture-site with one command (matches SC4's "single command" intent at parity).
- All local commands remain plain `npm ...` invocations — no daemon, no container runtime, no VM layer. Footprint audit in PROGRESS.md confirms this.
- CI builds and deploys may still use Docker because CI runners have the budget. The Dockerfile is a CI/deploy-only artifact in practice (it exists for self-hosters, not for the contributor's own workflow).
- The substitution is recorded in the README (Phase 11) so a reviewer reading the spec vs. the as-built system sees zero drift on capabilities — only on the local-dev convenience command.

## Compliance

- No file under `packages/`, `apps/`, or root-level `scripts/` invokes `docker`, `docker compose`, or `docker-compose`.
- `.dockerignore` present from Phase 1 to keep CI builds clean from day one.
- PROGRESS.md records each measured footprint (node_modules, Playwright cache) separately after every install.
