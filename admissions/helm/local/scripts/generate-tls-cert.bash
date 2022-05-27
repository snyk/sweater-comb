#!/usr/bin/env bash

set -euxo errexit pipefail

HERE=$(cd $(dirname $0); pwd)
cd $HERE/..
mkdir -p pki
cd pki

export APP=chart-admissions
export NAMESPACE=sweater-comb
export CSR_NAME="${APP}.${NAMESPACE}.svc"

# Create a self-signed CA
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

cat >$TMPDIR/ca.json <<EOF
{
  "CN": "$CSR_NAME CA",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [{
    "O": "Snyk"
  }]
}
EOF
cfssl gencert -initca $TMPDIR/ca.json | cfssljson -bare ca

# Create a Helm values YAML that configures a local deployment with the CA certificate.
# Kubernetes will use this root to trust the registered webhook.
CABUNDLE=$(base64 <ca.pem)
cat >../local.pki.yaml <<EOF
caBundle: $CABUNDLE
EOF

# Issue a server certificate for the webhook service.
cat >$TMPDIR/csr.json <<EOF
{
  "hosts": [
    "$APP",
    "$CSR_NAME",
    "$CSR_NAME.cluster.local"
  ],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [{
    "CN": "$CSR_NAME",
    "O": "Snyk"
  }]
}
EOF
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -hostname=$CSR_NAME $TMPDIR/csr.json | cfssljson -bare server
