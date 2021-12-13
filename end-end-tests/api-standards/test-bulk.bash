#!/usr/bin/env bash
set -eu
HERE=$(cd $(dirname $0); pwd)
cd $HERE/../..

CONTEXT=$(awk NF=NF RS= OFS= <$HERE/context.json)

COMPARE=${COMPARE:-yarn run bulk-compare}

tempdir=$(mktemp -d)
trap "rm -rf $tempdir" EXIT

cat >$tempdir/from_scratch <<EOF
{
    "comparisons": [{
        "to": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }]
}
EOF

cat >$tempdir/passes <<EOF
{
    "comparisons": [{
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml", "to": "$HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }]
}
EOF

cat >$tempdir/invalid_input <<EOF
{
    "comparisons": [{
        "nope": "nope"
    }]
}
EOF

cat >$tempdir/failures <<EOF
{
    "comparisons": [{
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-breaking-param-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-format-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-operation-removed.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-operationid-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-stability-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-type-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml", "to": "$HERE/resources/thing/2021-11-10/003-fail-type-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": "2021-11-10"}
    }]
}
EOF

${COMPARE} --input $tempdir/from_scratch
${COMPARE} --input $tempdir/invalid_input && (exit 1)
${COMPARE} --input $tempdir/passes
${COMPARE} --input $tempdir/failures && (exit 1)
