#!/usr/bin/env bash
set -e

CORE_DIR="lib/core"
REPO_URL="https://github.com/ItzFallenMe/anifox-core.git"

if [ -d "$CORE_DIR" ]; then
  echo "lib/core/ already exists, skipping clone."
  exit 0
fi

if [ -z "$PRIVATE_REPO_TOKEN" ]; then
  echo "ERROR: PRIVATE_REPO_TOKEN is not set."
  echo "Set it as an environment variable or GitHub Actions secret."
  exit 1
fi

echo "Cloning anifox-core..."
git clone "https://${PRIVATE_REPO_TOKEN}@github.com/ItzFallenMe/anifox-core.git" "$CORE_DIR"
echo "anifox-core fetched successfully."
