# `docs/ci-drafts/` — temporary holding location for workflow files

This directory exists because **the fine-grained Personal Access Token configured for the project (`~/.hermes/.env`'s `GITHUB_TOKEN`) does not yet have the GitHub `workflows: write` scope**. GitHub rejects every push that adds or modifies a file under `.github/workflows/` without that scope:

```
remote: refusing to allow a Personal Access Token to create or update
remote: workflow `.github/workflows/ci.yml` without `workflow` scope
```

For the initial Phase 1 push only, the four workflow files (this repo's `ci.yml`, `integration.yml`, `eval.yml`, `deploy.yml`) were moved here as a tracked-but-not-yet-active intermediate state. This avoids the fragile alternative of storing them in `/tmp`, which is cleared on reboot and is not visible to anyone reading the repo.

## Why these exist here (full chain of reasoning)

1. **Why move them out of `.github/workflows/`?** Because the fine-grained PAT that handled Phase 1's pushes has Contents: read+write only — not Workflows: read+write. The PAT is sufficient to manage source code, docs, and configs — but it cannot, by design, control GitHub Actions workflow files.
2. **Why store them inside the repo and not `/tmp`?** Because `/tmp` is ephemeral (cleared on reboot, by systemd-tmpfiles, or by anyone with shell access who runs `rm -rf /tmp/...`). A file that controls CI behavior must not be one reboot away from disappearing silently.
3. **Why are they not literal copies of what would otherwise be at `.github/workflows/?`** They _are_ the would-be `.github/workflows/*` files, preserved byte-for-byte. No edits were made; the moves preserve content exactly.
4. **When do they move back?** When the PAT is regenerated with `Workflows: read+write` permission added: a single commit moves them from `docs/ci-drafts/*.yml` to `.github/workflows/*.yml`, then deletes `docs/ci-drafts/`. This is a one-time, low-risk operation.

## What does NOT change

- The CI workflow logic itself is identical between this directory and what would have been at `.github/workflows/`.
- Phase 2+ plans that wire integration / eval / deploy (in their owning phases) reference these drafts by path and restore them at the start of that phase so CI is enabled by the time CI itself has work to do (Phases 9, 11).

## Cross-references

- ADR-0006 §"Consequences" — first discovered during the Phase 1 initial-push attempt.
- `.hermes/PROGRESS.md` Entry 1.6 — the moment this directory was first populated.
- `.gitignore` — none. These four files are intentionally tracked.
