#!/usr/bin/env bash

set -eu
cd $(dirname $0)
./generate-tls-cert.bash
./generate-tls-secrets.bash
