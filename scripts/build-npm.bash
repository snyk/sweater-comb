#!/usr/bin/env bash
set -eux
cd $(dirname $0)/..

# Stage 1: clean install of dev dependencies, build TS
npm ci
npm run build
npm pack
