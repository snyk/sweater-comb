#!/usr/bin/env bash
set -eu
HERE=$(cd $(dirname $0); pwd)
cd $HERE/../..

CONTEXT=$(awk NF=NF RS= OFS= <$HERE/context.json)

# These should pass

yarn run compare \
    --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --to $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    --context "${CONTEXT}"
yarn run compare \
    --from $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    --to $HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml \
    --context "${CONTEXT}"

# These should fail
FAILING_CHANGES="\
    $HERE/resources/thing/2021-11-10/001-fail-stability-change.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-breaking-param-change.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-operationid-change.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-operation-removed.yaml"
for fc in ${FAILING_CHANGES}; do
    yarn run compare \
        --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
        --to ${fc} \
        --context "${CONTEXT}" \
        && false || true
done
