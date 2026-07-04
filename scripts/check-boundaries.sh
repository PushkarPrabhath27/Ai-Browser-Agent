#!/usr/bin/env bash
# check-boundaries.sh
# Convenience wrapper around dependency-cruiser. Called by root npm script
# `npm run boundaries` and by CI. Returns non-zero on any forbidden import.

set -euo pipefail

# Resolve repo root regardless of call-site.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Use npx to invoke the locally-resolved binary without polluting global node_modules.
npx --no-install dependency-cruiser \
  --config .dependency-cruiser.js \
  --output-type err-long \
  packages/ apps/
