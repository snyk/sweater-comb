#!/usr/bin/env bash
set -eux
cd $(dirname $0)/..

. scripts/docker-env

docker build -t ${IMAGE}:${TAG} .
