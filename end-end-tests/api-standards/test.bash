#!/usr/bin/env bash
set -eu
HERE=$(cd $(dirname $0); pwd)
cd $HERE/../..

CONTEXT=$(awk NF=NF RS= OFS= <$HERE/context.json)

COMPARE=${COMPARE:-yarn run compare}

# These should pass

${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --to $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    --context "${CONTEXT}"
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    --to $HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml \
    --context "${CONTEXT}"

# This should fail
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml \
    --to $HERE/resources/thing/2021-11-10/003-fail-type-change.yaml \
    --context "${CONTEXT}" \
    && false || true

# These should fail
FAILING_CHANGES="\
    $HERE/resources/thing/2021-11-10/001-fail-stability-change.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-breaking-param-change.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-operationid-change.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-operation-removed.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-format-change.yaml \
    "
for fc in ${FAILING_CHANGES}; do
    ${COMPARE} \
        --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
        --to ${fc} \
        --context "${CONTEXT}" \
        && false || true
done
