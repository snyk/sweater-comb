#!/usr/bin/env bash
set -eu
cd $(dirname $0)/..

. scripts/docker-env

docker build -t ${IMAGE}:${TAG} .
