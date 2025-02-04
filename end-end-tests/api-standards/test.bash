#!/usr/bin/env bash
set -euxo pipefail
HERE=$(cd $(dirname $0); pwd)
export CI=""
cd $HERE/../..

CONTEXT=$(awk NF=NF RS= OFS= <$HERE/context.json)
CONTEXT_BETA=$(awk NF=NF RS= OFS= <$HERE/context-beta.json)
CONTEXT_GA=$(awk NF=NF RS= OFS= <$HERE/context-ga.json)

COMPARE=${COMPARE:-./node_modules/.bin/ts-node src/index.ts diff}

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
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    "null:" \
    $HERE/resources/async/2024-07-22/baseline.yaml \
    --check
assert_ok


### Baseline OK from scratch
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    "null:" \
    $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    --check
assert_ok

### Can add a property to baseline object
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    --check
assert_ok

### Can add an operation after adding a property field
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml \
    $HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml \
    --check
assert_ok

## breaking changes allowed at experimental

### Can sunset experimental
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    "null:" \
    --check
assert_ok

### Can make a breaking parameter change in experimental
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    $HERE/resources/thing/2021-11-10/001-ok-breaking-param-change.yaml \
    --check
assert_ok

### Can make a breaking type change in experimental
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    $HERE/resources/thing/2021-11-10/001-ok-type-change.yaml \
    --check
assert_ok
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml \
    $HERE/resources/thing/2021-11-10/003-ok-type-change.yaml \
    --check
assert_ok

### Can move from beta to ga in place
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/000-baseline.yaml \
    $HERE/resources/thing/2021-11-10/001-stability-change.yaml \
    --check
assert_ok


# These should fail

### Invalid naming convention
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    "null:" \
    $HERE/resources/thing/2021-11-10/000-fail-naming.yaml \
    --check
assert_err

OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    "null:" \
    $HERE/resources/thing/2021-11-10/001-fail-operationid-change.yaml \
    --check
assert_err

## breaking changes not allowed at beta

### cannot make a breaking type change in beta
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/000-baseline-beta.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-operationid-change-beta.yaml \
    --check
assert_err
OPTIC_DIFF_CONTEXT=$CONTEXT_BETA ${COMPARE} \
    $HERE/resources/thing/2021-11-10/000-baseline-beta.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-type-change-beta.yaml \
    --check
assert_err
OPTIC_DIFF_CONTEXT=$CONTEXT_BETA ${COMPARE} \
    $HERE/resources/thing/2021-11-10/002-ok-add-operation-beta.yaml \
    $HERE/resources/thing/2021-11-10/003-fail-type-change-beta.yaml \
    --check
assert_err

### Batch POST must 204
OPTIC_DIFF_CONTEXT=$CONTEXT_BETA ${COMPARE} \
    "null:" \
    $HERE/resources/thing/2021-11-10/002-fail-batch-post.yaml \
    --check
assert_err

### Batch POST must accept a collection
OPTIC_DIFF_CONTEXT=$CONTEXT_BETA ${COMPARE} \
    "null:" \
    $HERE/resources/thing/2021-11-10/002-fail-batch-post-bad-request.yaml \
    --check
assert_err

FAILING_CHANGES="\
    $HERE/resources/thing/2021-11-10/002-fail-singleton-no-pagination.yaml \
    $HERE/resources/thing/2021-11-10/002-fail-singleton.yaml \
    $HERE/resources/thing/2021-11-10/002-fail-paginated-post.yaml \
    "
for fc in ${FAILING_CHANGES}; do
    OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
        $HERE/resources/thing/2021-11-10/000-baseline.yaml \
        ${fc} \
        --check
    assert_err
done

BETA_FAILING_CHANGES="\
    $HERE/resources/thing/2021-11-10/001-fail-operation-removed-beta.yaml \
    $HERE/resources/thing/2021-11-10/001-fail-format-change-beta.yaml \
    "
for fc in ${BETA_FAILING_CHANGES}; do
    OPTIC_DIFF_CONTEXT=$CONTEXT_BETA ${COMPARE} \
        $HERE/resources/thing/2021-11-10/000-baseline-beta.yaml \
        ${fc} \
        --check
    assert_err
done


### 004 Tests delta mechanism for PRs

### Test invalid API getting another valid change - experimental
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/004-baseline-with-error.yaml \
    $HERE/resources/thing/2021-11-10/004-baseline-with-error-and-no-new-error.yaml \
    --check
assert_ok


### Test invalid API getting another invalid change - experimental
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/004-baseline-with-error.yaml \
    $HERE/resources/thing/2021-11-10/004-baseline-with-error-and-new-error.yaml \
    --check
assert_err


# ### Test invalid API getting another valid change - beta
OPTIC_DIFF_CONTEXT=$CONTEXT_BETA ${COMPARE} \
    $HERE/resources/thing/2021-11-10/004-baseline-beta-with-error.yaml \
    $HERE/resources/thing/2021-11-10/004-baseline-beta-with-error-and-no-new-error.yaml \
    --check
assert_ok

# ### Test invalid API getting another invalid change - beta
OPTIC_DIFF_CONTEXT=$CONTEXT ${COMPARE} \
    $HERE/resources/thing/2021-11-10/004-baseline-with-error.yaml \
    $HERE/resources/thing/2021-11-10/004-baseline-with-error-and-new-error.yaml \
    --check
assert_err

### Test invalid API getting another valid change -v2
OPTIC_DIFF_CONTEXT=$CONTEXT_GA ${COMPARE} \
    $HERE/resources/thing/2021-11-10/004-baseline-ga-with-error.yaml \
    $HERE/resources/thing/2021-11-10/004-baseline-ga-with-error-and-no-new-error.yaml \
    --check
assert_ok

### Test invalid API getting another invalid change -v2
OPTIC_DIFF_CONTEXT=$CONTEXT_GA ${COMPARE} \
    $HERE/resources/thing/2021-11-10/004-baseline-ga-with-error.yaml \
    $HERE/resources/thing/2021-11-10/004-baseline-ga-with-error-and-new-error.yaml \
    --check
assert_err

