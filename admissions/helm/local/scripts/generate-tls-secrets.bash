#!/usr/bin/env bash

set -euxo errexit pipefail

HERE=$(cd $(dirname $0); pwd)
cd $HERE/..

export APP=chart-admissions
export NAMESPACE=sweater-comb
export CSR_NAME="${APP}.${NAMESPACE}.svc"

kubectl get ns $NAMESPACE || kubectl create ns $NAMESPACE

kubectl -n $NAMESPACE delete secret ${APP}-tls || :
kubectl -n $NAMESPACE create secret tls ${APP}-tls --cert=pki/server.pem --key=pki/server-key.pem
