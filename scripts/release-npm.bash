#!/usr/bin/env bash
set -eux
cd $(dirname $0)/..

NOW=$(date '+%Y%m%d%H%M')
COMMIT=$(git rev-parse --short HEAD)
export VERSION=$(git describe --tags --abbrev=0)+${NOW}-${COMMIT}

tmp_package=$(mktemp)
trap "rm -f $tmp_package" EXIT

jq -r ".version = \"$VERSION\"" package.json > $tmp_package
mv $tmp_package package.json

npm publish
