#!/usr/bin/env bash
# ─── AniFox local checks ───
# Runs static analysis and the test suite.
# Usage: bash scripts/check.sh
set -e
cd "$(dirname "$0")/.."

echo "→ flutter pub get"
flutter pub get

echo "→ flutter analyze (fails on errors+warnings; SDK deprecation infos pass)"
# --no-fatal-infos is required: flutter analyze exits 1 on infos by default.
# The 4 remaining infos are Flutter SDK deprecation notices in pre-existing
# player/downloads widgets, not defects. Real errors/warnings still fail.
flutter analyze --no-fatal-infos

echo "→ flutter test"
flutter test

echo "✓ All checks passed."
