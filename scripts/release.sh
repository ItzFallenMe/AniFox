#!/usr/bin/env bash
# ─── AniFox Release Script ───
# Validates the repo, syncs the pubspec version, tags, and pushes to trigger
# the GitHub Actions multi-platform build.
#
# Usage:
#   bash scripts/release.sh 2.0.0            # release v2.0.0
#   bash scripts/release.sh --dry-run 2.0.0  # preview without pushing
#
# The repo now ships the FULL source tree (lib/core included), so no private
# submodule/remote fetch is needed.
set -e
cd "$(dirname "$0")/.."

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
  shift
fi
if [ "${1:-}" = "--help" ] || [ -z "${1:-}" ]; then
  echo "Usage: bash scripts/release.sh [--dry-run] <version>"
  echo "Example: bash scripts/release.sh 2.0.0"
  exit 1
fi

VERSION="$1"
TAG="v${VERSION}"
REPO="https://github.com/ItzFallenMe/AniFox.git"

echo "════════════════════════════════════════"
echo " AniFox Release: $TAG"
if $DRY_RUN; then echo " (DRY RUN)"; fi
echo "════════════════════════════════════════"
echo ""

# ─── 1. Pre-flight checks ───
echo "→ Checking prerequisites..."

if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo "  ⚠  Uncommitted changes detected. Commit or stash first."
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "  ⚠  Tag $TAG already exists."
  exit 1
fi

# Full source must be present (no more private core submodule).
if [ ! -f "lib/core/app/version.dart" ]; then
  echo "  ⚠  lib/core is missing. This repo ships the full source tree."
  exit 1
fi

# ─── 2. Version must match pubspec ───
PUB_VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //; s/+.*//')
if [ "$PUB_VERSION" != "$VERSION" ]; then
  echo "  ⚠  pubspec version is '$PUB_VERSION' but you asked for '$VERSION'."
  echo "     Update the 'version:' field in pubspec.yaml first."
  exit 1
fi
echo "  pubspec version matches ($PUB_VERSION)."

# ─── 3. Quality gate ───
echo "→ Running checks (analyze + tests)..."
if $DRY_RUN; then
  echo "  (skipped in dry run)"
else
  bash scripts/check.sh
fi

# ─── 4. Tag ───
echo "→ Creating tag $TAG"
if $DRY_RUN; then
  echo "  git tag -a $TAG -m 'Release $TAG'"
else
  git tag -a "$TAG" -m "Release $TAG"
fi

# ─── 5. Push ───
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "→ Pushing $TAG to $REPO ($BRANCH)..."
if $DRY_RUN; then
  echo "  git push origin $BRANCH --tags"
else
  git push origin "$BRANCH" --tags
fi

echo ""
echo "════════════════════════════════════════"
if $DRY_RUN; then
  echo " Dry run complete — nothing was pushed."
else
  echo " Done! Tag $TAG pushed."
  echo " Actions: https://github.com/ItzFallenMe/AniFox/actions"
  echo ""
  echo " Artifacts will include: APKs, windows.zip, linux.zip, macos.zip"
fi
echo "════════════════════════════════════════"