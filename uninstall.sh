#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

pi remove "$ROOT"

echo
echo "Removed pi-rtk-bridge: $ROOT"
echo "Reload Pi with: /reload"
