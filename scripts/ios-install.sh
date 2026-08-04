#!/usr/bin/env bash
#
# Install the isolated-build UGCio app onto a physical iPhone over Wi-Fi.
#
# Reads from the same isolated DerivedData location as ios-build.sh. The install
# is retried because the device's Wi-Fi tunnel drops when the phone sleeps
# (USB data is dead on this phone, so it installs over Wi-Fi only). Keep the
# phone awake and on the same network for a faster landing.
#
# Usage:
#   scripts/ios-install.sh                     # install to default iPhone
#   DEVICE_ID=ACD07606-... scripts/ios-install.sh   # a different device
#
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEME="UGCPortfolioRateHub"
CONFIG="${CONFIG:-Release}"
DERIVED_DATA="${UGCIO_DERIVED_DATA:-$HOME/Library/Developer/Xcode/DerivedData-UGCio}"

# devicectl identifier (the coredevice UUID from `xcrun devicectl list devices`,
# NOT the hardware UDID that ios-build.sh uses).
DEVICE_ID="${DEVICE_ID:-ACD07606-72F6-5A1B-878C-1BFBC865832A}"

APP="$DERIVED_DATA/Build/Products/$CONFIG-iphoneos/$SCHEME.app"

if [ ! -d "$APP" ]; then
  echo "App not found at:" >&2
  echo "  $APP" >&2
  echo "Run scripts/ios-build.sh first." >&2
  exit 1
fi

for i in $(seq 1 30); do
  echo "install attempt $i…"
  if xcrun devicectl device install app --device "$DEVICE_ID" "$APP"; then
    echo "INSTALLED"
    exit 0
  fi
  sleep 20
done

echo "Install failed after 30 attempts — is the iPhone awake and on Wi-Fi?" >&2
exit 1
