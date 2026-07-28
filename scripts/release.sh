#!/usr/bin/env bash
set -e

# ─── AniFox Release Script ───
# Pushes code from AniFoxSrc (private dev) to AniFox (public release)
# and tags it to trigger the GitHub Actions build.
#
# Usage:
#   ./scripts/release.sh 1.0.0          # release v1.0.0
#   ./scripts/release.sh --dry-run 1.0.0 # preview without pushing

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  shift
fi

if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh [--dry-run] <version>"
  echo "Example: ./scripts/release.sh 1.0.0"
  exit 1
fi

VERSION="$1"
TAG="v${VERSION}"
PUBLIC_REMOTE="public"
PUBLIC_REPO="https://github.com/ItzFallenMe/AniFox.git"

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

# ─── 2. Ensure core is fetched ───
if [ ! -d "lib/core" ]; then
  echo "→ Fetching anifox-core..."
  if $DRY_RUN; then
    echo "  (skipped in dry run)"
  else
    bash scripts/fetch_core.sh
  fi
fi

# ─── 3. Setup public remote ───
if ! git remote get-url "$PUBLIC_REMOTE" >/dev/null 2>&1; then
  echo "→ Adding '$PUBLIC_REMOTE' remote..."
  if $DRY_RUN; then
    echo "  git remote add $PUBLIC_REMOTE $PUBLIC_REPO"
  else
    git remote add "$PUBLIC_REMOTE" "$PUBLIC_REPO"
  fi
fi

# ─── 4. Create tag ───
echo "→ Creating tag $TAG"
if $DRY_RUN; then
  echo "  git tag -a $TAG -m 'Release $TAG'"
else
  git tag -a "$TAG" -m "Release $TAG"
fi

# ─── 5. Push to public repo ───
echo "→ Pushing to AniFox (public)..."
if $DRY_RUN; then
  echo "  git push $PUBLIC_REMOTE master:main --tags"
else
  git push "$PUBLIC_REMOTE" master:main --tags
fi

echo ""
echo "════════════════════════════════════════"
echo " Done!"
if ! $DRY_RUN; then
  echo " Tag $TAG pushed. GitHub Actions will build the APK."
  echo ""
  echo " Actions: https://github.com/ItzFallenMe/AniFox/actions"
fi
echo "════════════════════════════════════════"
