#!/usr/bin/env bash
# ─── AniFox local checks ───
# Runs static analysis and the test suite.
# Usage: bash scripts/check.sh
set -e
cd "$(dirname "$0")/.."

echo "→ flutter pub get"
flutter pub get

echo "→ flutter analyze (fails only on errors/warnings, not infos)"
flutter analyze --no-fatal-infos

echo "→ flutter test"
flutter test

echo "✓ All checks passed."
