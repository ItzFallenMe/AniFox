#!/usr/bin/env bash
# ─── AniFox local builds ───
# Builds release artifacts for one or all platforms.
#
# Usage:
#   bash scripts/build.sh android          # APKs (universal + split)
#   bash scripts/build.sh windows          # windows.zip
#   bash scripts/build.sh linux            # linux.zip
#   bash scripts/build.sh macos            # macos.zip (unsigned)
#   bash scripts/build.sh all              # everything for this machine
#
# Requires .env (copy from .env_example). Override with ENV_FILE=path.
set -e
cd "$(dirname "$0")/.."

TARGET="${1:-android}"
ENV_FILE="${ENV_FILE:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "⚠  $ENV_FILE not found. Copy .env_example to $ENV_FILE first."
  exit 1
fi

VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //; s/+.*//')
VERSION_CODE=$(grep '^version:' pubspec.yaml | sed 's/.*+//')
echo "Building AniFox v$VERSION+$VERSION_CODE → $TARGET"
echo ""

build_android() {
  flutter build apk --release \
    --dart-define-from-file="$ENV_FILE" \
    --build-number="$VERSION_CODE" --build-name="$VERSION"
  flutter build apk --release --split-per-abi \
    --dart-define-from-file="$ENV_FILE" \
    --build-number="$VERSION_CODE" --build-name="$VERSION"
  echo "→ build/app/outputs/flutter-apk/"
}

build_windows() {
  flutter config --enable-windows-desktop
  flutter build windows --release \
    --dart-define-from-file="$ENV_FILE" \
    --build-number="$VERSION_CODE" --build-name="$VERSION"
  rm -f build/windows.zip
  (cd build/windows/x64/runner/Release && zip -qr ../../../../windows.zip ./*)
  echo "→ build/windows.zip"
}

build_linux() {
  # System libs required by the Flutter Linux plugins. Discover them with:
  #   python3 -c "import json;print([p['name'] for p in json.load(open('.flutter-plugins-dependencies'))['plugins']['linux']])"
  # webkit2gtk-4.1 -> desktop_webview_window / flutter_web_auth_2
  # libsecret-1     -> flutter_secure_storage_linux
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y \
      clang cmake git ninja-build pkg-config \
      libgtk-3-dev liblzma-dev libstdc++-12-dev \
      libwebkit2gtk-4.1-dev \
      libsecret-1-dev
  fi
  flutter config --enable-linux-desktop
  flutter build linux --release \
    --dart-define-from-file="$ENV_FILE" \
    --build-number="$VERSION_CODE" --build-name="$VERSION"
  rm -f build/linux.zip
  (cd build/linux/x64/release/bundle && zip -qr ../../../../linux.zip ./*)
  echo "→ build/linux.zip"
}

build_macos() {
  flutter config --enable-macos-desktop
  flutter build macos --release \
    --dart-define-from-file="$ENV_FILE" \
    --build-number="$VERSION_CODE" --build-name="$VERSION"
  rm -f build/macos.zip
  (cd build/macos/Build/Products/Release && zip -qr ../../../../../macos.zip ./*.app)
  echo "→ build/macos.zip (unsigned — sign/notarize before distributing)"
}

case "$TARGET" in
  android) build_android ;;
  windows) build_windows ;;
  linux) build_linux ;;
  macos) build_macos ;;
  all)
    case "$(uname -s)" in
      Linux*) build_android; build_linux ;;
      Darwin*) build_android; build_macos ;;
      MINGW*|MSYS*|CYGWIN*) build_android; build_windows ;;
      *) build_android ;;
    esac
    ;;
  *) echo "Unknown target: $TARGET (android|windows|linux|macos|all)"; exit 1 ;;
esac

echo ""
echo "✓ Done."
