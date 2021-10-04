#!/usr/bin/env bash
set -eu
cd $(dirname $0)/..

. scripts/docker-env
scripts/build-docker.bash

docker push ${IMAGE}:${TAG}
docker push ${IMAGE}:latest
