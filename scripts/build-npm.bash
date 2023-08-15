#!/usr/bin/env bash
set -eux
cd $(dirname $0)/..

# Stage 1: clean install of dev dependencies, build TS
npm ci
npm pack

# Use GH_TOKEN as a fallback if GITHUB_TOKEN is not set
export GITHUB_TOKEN=${GITHUB_TOKEN:-$GH_TOKEN}

if [[ -n "$GITHUB_TOKEN" && -n "$NPM_TOKEN" ]]; then
  npx semantic-release
fi
