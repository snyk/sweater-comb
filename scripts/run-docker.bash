#!/usr/bin/env bash

set -eu
cd $(dirname $0)/..

docker run --rm -it -v $(pwd):/target docker.io/snyk/sweater-comb:optic-latest "$@"
