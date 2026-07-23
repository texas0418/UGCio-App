#!/usr/bin/env bash
#
# Build UGCio for a physical iOS device in an ISOLATED DerivedData location.
#
# Why isolated: this machine's Xcode is set to the shared "Build/" DerivedData
# location, so a normal build shares ~/Library/Developer/Xcode/DerivedData/Build
# with every other project (e.g. PaintTheTown/W4nder). Two builds there fight
# over the same build.db and fail with "database is locked". Pinning a private
# derivedDataPath here lets UGCio build alongside anything else, no contention.
#
# The device-targeted destination (not generic/platform=iOS) is what makes
# automatic signing register the phone into the com.ugcio.app profile — without
# it, install fails with 0xe8008012 "profile cannot be installed on this device".
#
# Usage:
#   scripts/ios-build.sh                       # Release, default iPhone
#   CONFIG=Debug scripts/ios-build.sh          # Debug build
#   DEVICE_UDID=00008030-... scripts/ios-build.sh   # a different device
#
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="$REPO/ios/UGCPortfolioRateHub.xcworkspace"
SCHEME="UGCPortfolioRateHub"
CONFIG="${CONFIG:-Release}"

# Isolated build output — override with UGCIO_DERIVED_DATA if desired.
DERIVED_DATA="${UGCIO_DERIVED_DATA:-$HOME/Library/Developer/Xcode/DerivedData-UGCio}"

# Hardware UDID of the target device (xcodebuild -destination wants this, which
# is NOT the same as the devicectl identifier used by ios-install.sh).
DEVICE_UDID="${DEVICE_UDID:-00008030-000A69580CC1802E}"

echo "Building $SCHEME ($CONFIG)"
echo "  DerivedData: $DERIVED_DATA (isolated)"
echo "  Device UDID: $DEVICE_UDID"

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -destination "id=$DEVICE_UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration \
  build

echo ""
echo "Built: $DERIVED_DATA/Build/Products/$CONFIG-iphoneos/$SCHEME.app"
echo "Install it with: scripts/ios-install.sh"
