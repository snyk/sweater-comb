#!/usr/bin/env bash
set -euxo pipefail
HERE=$(cd $(dirname $0); pwd)
export CI=""
cd $HERE/../..

CONTEXT=$(awk NF=NF RS= OFS= <$HERE/context.json)
CONTEXT_BETA=$(awk NF=NF RS= OFS= <$HERE/context-beta.json)

COMPARE=${COMPARE:-./node_modules/.bin/ts-node src/index.ts compare}

set +e

function assert_ok {
    if [ "$?" != "0" ]; then
        echo "unexpected rc=$?"
        exit 1
    fi
}

function assert_err {
    if [ "$?" == "0" ]; then
        echo "unexpected rc=$?"
        exit 1
    fi
}

# These should pass

### Baseline OK from scratch
${COMPARE} \
    --to $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --context "${CONTEXT}"
assert_ok

### Can add a property to baseline object
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --to $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    --context "${CONTEXT}"
assert_ok

### Can add an operation after adding a property field
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    --to $HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml \
    --context "${CONTEXT}"
assert_ok

## breaking changes allowed at experimental

### Can sunset experimental
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --context "${CONTEXT}"
assert_ok

### Can make a breaking parameter change in experimental
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --to $HERE/resources/thing/2021-11-10/001-ok-breaking-param-change.yaml \
    --context "${CONTEXT}"
assert_ok

### Can make a breaking type change in experimental
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --to $HERE/resources/thing/2021-11-10/001-ok-type-change.yaml \
    --context "${CONTEXT}"
assert_ok
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml \
    --to $HERE/resources/thing/2021-11-10/003-ok-type-change.yaml \
    --context "${CONTEXT}"
assert_ok

# These should fail

### Invalid naming convention
${COMPARE} \
    --to $HERE/resources/thing/2021-11-10/000-fail-naming.yaml \
    --context "${CONTEXT}"
assert_err

${COMPARE} \
    --to $HERE/resources/thing/2021-11-10/001-fail-operationid-change.yaml \
    --context "${CONTEXT}"
assert_err

## breaking changes not allowed at beta

### cannot make a breaking type change in beta
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/000-baseline-beta.yaml \
    --to $HERE/resources/thing/2021-11-10/001-fail-operationid-change-beta.yaml \
    --context "${CONTEXT}"
assert_err
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/000-baseline-beta.yaml \
    --to $HERE/resources/thing/2021-11-10/001-fail-type-change-beta.yaml \
    --context "${CONTEXT_BETA}"
assert_err
${COMPARE} \
    --from $HERE/resources/thing/2021-11-10/002-ok-add-operation-beta.yaml \
    --to $HERE/resources/thing/2021-11-10/003-fail-type-change-beta.yaml \
    --context "${CONTEXT_BETA}"
assert_err

### Batch POST must 204
${COMPARE} \
    --to $HERE/resources/thing/2021-11-10/002-fail-batch-post.yaml \
    --context "${CONTEXT_BETA}"
assert_err

### Batch POST must accept a collection
${COMPARE} \
    --to $HERE/resources/thing/2021-11-10/002-fail-batch-post-bad-request.yaml \
    --context "${CONTEXT_BETA}"
assert_err

FAILING_CHANGES="\
    $HERE/resources/thing/2021-11-10/001-fail-stability-change.yaml \
    $HERE/resources/thing/2021-11-10/002-fail-singleton-no-pagination.yaml \
    $HERE/resources/thing/2021-11-10/002-fail-singleton.yaml \
    $HERE/resources/thing/2021-11-10/002-fail-paginated-post.yaml \
    "
for fc in ${FAILING_CHANGES}; do
    ${COMPARE} \
        --from $HERE/resources/thing/2021-11-10/000-baseline.yaml \
        --to ${fc} \
        --context "${CONTEXT}"
    assert_err
done

BETA_FAILING_CHANGES="\
    $HERE/resources/thing/2021-11-10/001-fail-operation-removed-beta.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-format-change-beta.yaml \
    "
for fc in ${BETA_FAILING_CHANGES}; do
    ${COMPARE} \
        --from $HERE/resources/thing/2021-11-10/000-baseline-beta.yaml \
        --to ${fc} \
        --context "${CONTEXT_BETA}"
    assert_err
done
