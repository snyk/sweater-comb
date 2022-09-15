#!/usr/bin/env bash
set -eu
HERE=$(cd $(dirname $0); pwd)
export CI=""
cd $HERE/../..

CONTEXT=$(awk NF=NF RS= OFS= <$HERE/context.json)

COMPARE=${COMPARE:-./node_modules/.bin/ts-node src/index.ts bulk-compare}

tempdir=$(mktemp -d)
trap "rm -rf $tempdir" EXIT

set +e

function assert_ok {
    rc=$?
    if [ "$rc" != "0" ]; then
        echo "unexpected rc=$rc"
        exit 1
    fi
}

function assert_err {
    rc=$?
    if [ "$rc" == "0" ]; then
        echo "unexpected rc=$rc"
        exit 1
    fi
}

echo "*** TEST: 'from scratch' comparisons of well-formed OpenAPI ***"
cat >$tempdir/from_scratch <<EOF
{
    "comparisons": [{
        "to": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }]
}
EOF
${COMPARE} --input $tempdir/from_scratch
assert_ok

echo "*** TEST: comparisons that should pass our rules ***"
cat >$tempdir/passes <<EOF
{
    "comparisons": [{
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml", "to": "$HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-fail-naming.yaml", "to": "$HERE/resources/thing/2021-11-10/000-fail-naming.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-batch-post.yaml", "to": "$HERE/resources/thing/2021-11-10/000-batch-post.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "to": "$HERE/resources/thing/2021-11-10/001-singleton.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "to": "$HERE/resources/thing/2021-11-10/000-baseline-in-reform.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }]
}
EOF
${COMPARE} --input $tempdir/passes
assert_ok

echo "*** TEST: invalid comparison passed to bulk-compare, expect failure ***"
cat >$tempdir/invalid_input <<EOF
{
    "comparisons": [{
        "nope": "nope"
    }]
}
EOF
${COMPARE} --input $tempdir/invalid_input
assert_err

echo "*** TEST: comparisons that should fail our rules; expect failure ***"
cat >$tempdir/failures <<EOF
{
    "comparisons": [{
        "to": "$HERE/resources/thing/2021-11-10/000-fail-naming.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline-beta.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-breaking-param-change-beta.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "beta"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline-beta.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-format-change-beta.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "beta"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline-beta.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-operation-removed-beta.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "beta"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-operationid-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-stability-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline-beta.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-type-change-beta.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "beta"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/002-ok-add-operation-beta.yaml", "to": "$HERE/resources/thing/2021-11-10/003-fail-type-change-beta.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "beta"}}
    }, {
        "to": "$HERE/resources/thing/2021-11-10/002-fail-singleton.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "to": "$HERE/resources/thing/2021-11-10/002-fail-batch-post.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/003-jsonapi.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "to": "$HERE/resources/thing/2021-11-10/002-fail-singleton-no-pagination.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }]
}
EOF
${COMPARE} --input $tempdir/failures
assert_err

echo "ALL TESTS OK"
