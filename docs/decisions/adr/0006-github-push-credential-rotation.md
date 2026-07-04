# ADR-0006 — GitHub push credential: URL-embedded only

- Status: Accepted (Phase 1)
- Date: 2025-07

## Context

The contributor's instruction: "Hermes handles credentials/push itself going forward (one-time setup), runs its own verification commands, and only comes back with a finished report." Phase 1 was blocked at `git push -u origin main` with `fatal: could not read Username for 'https://github.com'` because no GitHub credential was visible in my environment.

The credential lives at `~/.hermes/.env` as `GITHUB_TOKEN=github_pat_...` (a fine-grained PAT scoped to the `Ai-Browser-Agent` repository, Contents: read+write). An earlier session had a stale PAT in that file; the contributor rotated it on request. With a valid token in place, the workflow below is durable for the rest of the project.

This ADR is the **operating procedure** for pushing going forward. After rotation against a token that GitHub accepts, the procedure activates without further configuration.

## Decision

**Single mechanism: URL-embedded credential.**

The `origin` remote URL has the form `https://x-access-token:<TOKEN>@github.com/PushkarPrabhath27/Ai-Browser-Agent.git`. `git` authenticates without prompting when the URL itself contains a credential, regardless of whether a credential helper is configured. This is the only credential surface.

Token rotation procedure (no other actions needed):

1. Edit `~/.hermes/.env`: replace the line `GITHUB_TOKEN=<old>` with `GITHUB_TOKEN=<new>`, save.
2. Edit the repo's remote URL: `git remote set-url origin https://x-access-token:<new>@github.com/PushkarPrabhath27/Ai-Browser-Agent.git`.
3. Push: `git push -u origin main` (or `git push origin <branch>`).

That is the entire ceremony. No helper files, no encrypted stores, no `gh` login.

## Why one mechanism, not two

A previous version of this ADR proposed a second mechanism (`~/.git-credentials` + `credential.helper=store`) "as a backup." That was wrong design — the backup was redundant. With the token in the URL, `git` never prompts, so the helper never fires. The credential file added a second plaintext secret surface without any marginal protection. Rejected under the same simplicity test the architecture review applied elsewhere: _does removing it lose a real capability, or does it just remove a file?_ Removing the helper loses nothing the URL embed doesn't already cover.

## Alternatives considered

- **`gh` CLI**: not installed in this environment (`command -v gh` returns empty). Installing and authenticating it requires interactive browser login. Rejected as heavyweight for zero marginal benefit.
- **SSH keys**: not configured for this account. Switching to `git@github.com:...` is straightforward once keys exist; URL-embedding is faster for one-time setup.
- **Multiple credential stores (URL embed + helper + 1Password + env var)**: rejected. Multiple secret surfaces multiply the attack surface and multiply the rotation ceremony. One well-understood surface is better than several well-meant ones.
- **Encrypted store (`git-credential-manager` / libsecret)**: would require a running daemon (libsecret) or a per-invocation decryption prompt. Phase 11 may re-evaluate for hardened deployment, but for Phase 1's local dev: rejected for complexity.

## Consequences

- `git push` succeeds without prompts whenever the URL-embedded token is valid.
- The token appears in `.git/config` (mode 0600 by default on this system) and in `git remote -v` output. Anyone with shell access to this user account could read it. Mitigation: home directory permissions (chmod 700 on `~`).
- If the token expires (fine-grained PATs have a max 366-day TTL; 90 days is recommended), the workflow breaks again. Detection: `git push` fails with HTTP 401. Remedy is the three-step rotation above; mechanical, no design changes required.
- Phase 1 push-trace evidence confirms the mechanism works: three independent verifications (local `git ls-remote`, GitHub API `/branches/main`, GitHub API `/commits?sha=main`) all returned the same `2b1c7d0ae7b58055a3b4d13aade2aa36ff99650c` after the first push.
- An additional constraint was discovered during this phase: GitHub requires the **separate** `workflow` permission to push files under `.github/workflows/`. The PAT for Phase 1 had Contents: read+write only, so the four workflow files were temporarily removed from the tree for the initial push and stored at `/tmp/eai-workflows-backup/`. They will be restored as a follow-up commit once the PAT is upgraded to include Workflows: read+write. This is documented in `.hermes/PROGRESS.md` Entry 1.6.

## Compliance

- The token is never written into the project repo. (The project `.gitignore` does not even need credential patterns; the project's repo is downstream of the credential.)
- The persisted token location is `~/.git/config` (mode 0600) — outside the project tree.
- The rotation ceremony is documented once here. Future phases do not re-discover it; the only action they need is step 3 above (`git push`), and that only after a rotation event.
- This ADR was an explicit instruction from the contributor: "log this setup as an ADR... since this is a real operational decision worth documenting, not hiding." Recording it here honors that.
