#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

pi install "$ROOT"

echo
echo "Installed pi-rtk-bridge from: $ROOT"
echo "Next steps:"
echo "  1. Install RTK if needed: brew install rtk"
echo "  2. Verify: rtk --version && rtk gain"
echo "  3. Reload Pi: /reload"
echo "  4. Check status in Pi: /rtk-status"
