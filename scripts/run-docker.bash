#!/usr/bin/env bash

set -eu
cd $(dirname $0)/..

docker run --rm -it -v $(pwd):$(pwd) docker.io/snyk/sweater-comb:optic-latest "$@"
