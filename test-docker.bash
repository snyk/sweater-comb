#!/usr/bin/env bash

set -eu
cd $(dirname $0)

docker build -t snyk/sweater-comb .
docker run --rm -it -v $(pwd):/target snyk/sweater-comb lint -r /snyk/rules/apinext.yaml /target/tests/**/*.yaml
