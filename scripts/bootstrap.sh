#!/usr/bin/env bash
# bootstrap.sh
# Idempotent local environment setup. Safe to re-run.
# Does NOT install Docker or Ollama by design (see ADR-0003, ADR-0005).
# Does install: npm dependencies, Prettier hooks via Husky.

set -euo pipefail

echo "==> [bootstrap] Verifying Node + npm"
command -v node >/dev/null || { echo "Node not found. Install Node $(cat .nvmrc) first."; exit 1; }
command -v npm >/dev/null || { echo "npm not found."; exit 1; }

echo "==> [bootstrap] Installing workspace dependencies (npm install)"
npm install

echo "==> [bootstrap] Initializing Husky git hooks (idempotent)"
if [ -d .git ]; then
  npm run prepare >/dev/null 2>&1 || true
  if [ ! -f .husky/pre-push ]; then
    mkdir -p .husky
    cat > .husky/pre-push <<'EOF'
# Conventional Commits enforcement for pushed commits.
npx --no-install commitlint --edit "$1"
EOF
    echo "Wrote .husky/pre-push"
  fi
else
  echo "Skipping Husky setup: no .git directory yet."
fi

echo "==> [bootstrap] Done."
echo "    Next step: run 'npm run typecheck', 'npm run test', 'npm run boundaries'."
echo "    Or just: 'npm run dev' to boot server + fixture-site."
