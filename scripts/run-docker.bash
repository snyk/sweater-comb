#!/usr/bin/env bash

set -eu
cd $(dirname $0)/..

docker run --rm -v $(pwd):$(pwd) ghcr.io/snyk/sweater-comb:optic-main "$@"
