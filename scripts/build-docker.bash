#!/usr/bin/env bash
set -eu
cd $(dirname $0)/..

. scripts/docker-env

docker build --no-cache -t ${IMAGE}:${TAG} .
