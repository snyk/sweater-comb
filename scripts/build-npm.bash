#!/usr/bin/env bash
set -eux
cd $(dirname $0)/..

# Stage 1: clean install of dev dependencies, build TS
rm -rf node_modules
yarn install
yarn clean
yarn build
npm pack

if [[ -n "$GITHUB_TOKEN" && -n "$NPM_TOKEN" ]]; then
  npx semantic-release
fi
