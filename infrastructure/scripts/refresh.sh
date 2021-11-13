#!/usr/bin/env bash

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(../scripts/assumeDeveloperRole.sh)
fi

### Refresh infrastructure

# Clear any pending operations on the stack
pulumi stack -s dev export | jq ".deployment.pending_operations=[]" | pulumi stack -s dev import

# Refresh infrastructure state with no prompt
pulumi refresh -s dev -y
