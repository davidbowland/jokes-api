#!/usr/bin/env bash

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(../scripts/assumeDeveloperRole.sh)
fi

### Refresh infrastructure

# Refresh state with infrastructure
pulumi refresh -s dev
