#!/bin/bash

opticCiDev() {
    ts-node src/index.ts "$@"
}

contextFromFile() {
  cat "$@" | jq -c . | tr -d '^J'sh
}