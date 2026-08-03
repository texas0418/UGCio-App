#!/usr/bin/env bash
#
# Submit the latest EAS iOS build to App Store Connect.
#
# The App Store Connect API credentials are passed via environment rather than
# committed to eas.json — this repo is public, and gitleaks (correctly) flags
# the issuer id as a high-entropy value. The .p8 private key itself must never
# be committed; keep it in ~/.appstoreconnect/private_keys/.
#
# Set these before running (or export them in your shell profile):
#   ASC_KEY_ID     e.g. R2T6RB2W97   (from the AuthKey_<ID>.p8 filename)
#   ASC_ISSUER_ID  App Store Connect > Users and Access > Integrations
#
# Usage: ASC_KEY_ID=... ASC_ISSUER_ID=... scripts/eas-submit-ios.sh
#
set -euo pipefail

: "${ASC_KEY_ID:?set ASC_KEY_ID (see App Store Connect > Users and Access > Integrations)}"
: "${ASC_ISSUER_ID:?set ASC_ISSUER_ID (see App Store Connect > Users and Access > Integrations)}"

KEY_PATH="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8}"
[ -f "$KEY_PATH" ] || { echo "API key not found at $KEY_PATH" >&2; exit 1; }

export EXPO_ASC_API_KEY_PATH="$KEY_PATH"
export EXPO_ASC_KEY_ID="$ASC_KEY_ID"
export EXPO_ASC_ISSUER_ID="$ASC_ISSUER_ID"

cd "$(dirname "${BASH_SOURCE[0]}")/../expo"
exec eas submit --platform ios --profile production --latest --non-interactive
