#!/usr/bin/env bash
set -eu
HERE=$(cd $(dirname $0); pwd)
cd $HERE/../..

CONTEXT=$(awk NF=NF RS= OFS= <$HERE/context.json)

COMPARE=${COMPARE:-yarn run bulk-compare}

good_input=$(mktemp)
bad_input=$(mktemp)
trap "rm -f $good_input $bad_input" EXIT

cat >$good_input <<EOF
{
    "comparisons": [{
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/001-ok-add-property-field.yaml", "to": "$HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-fail-naming.yaml", "to": "$HERE/resources/thing/2021-11-10/000-fail-naming.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }]
}
EOF

cat >$bad_input <<EOF
{
    "comparisons": [{
        "to": "$HERE/resources/thing/2021-11-10/000-fail-naming.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-breaking-param-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-format-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-operation-removed.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-operationid-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-stability-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/000-baseline.yaml", "to": "$HERE/resources/thing/2021-11-10/001-fail-type-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }, {
        "from": "$HERE/resources/thing/2021-11-10/002-ok-add-operation.yaml", "to": "$HERE/resources/thing/2021-11-10/003-fail-type-change.yaml", "context": {"changeDate": "2021-11-11", "changeResource": "thing", "changeVersion": {"date": "2021-11-10", "stability": "experimental"}}
    }]
}
EOF

${COMPARE} --input $good_input
${COMPARE} --input $bad_input && false || true
