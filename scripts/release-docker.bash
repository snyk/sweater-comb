#!/usr/bin/env bash
set -eu
cd $(dirname $0)/..

. scripts/docker-env
scripts/build-docker.bash

docker push ${IMAGE}:${TAG}
if [[ "${TAG}" == "${LATEST_GIT_TAG}" ]]; then
  docker tag ${IMAGE}:${TAG} ${IMAGE}:latest
  docker push ${IMAGE}:latest
fi
