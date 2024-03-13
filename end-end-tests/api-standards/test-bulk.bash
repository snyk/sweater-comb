#!/usr/bin/env bash
set -eu
REPO=$(pwd)
HERE=$(cd $(dirname $0); pwd)
SPECS_PATH=end-end-tests/api-standards/resources/thing/2021-11-10
export CI=""

COMPARE=${COMPARE:-$REPO/node_modules/.bin/ts-node $REPO/src/index.ts diff-all}

tempdir=$(mktemp -d)
trap "rm -rf $tempdir" EXIT

set +e

function init_git_repo {
    mkdir $tempdir/from_scratch
    cd $tempdir/from_scratch
    git init -b main \
        && git config user.email "test@example.com" \
        && git config user.name "test test" \
        && git config commit.gpgsign false \
        && git remote add origin git@github.com:User/UserRepo.git
}

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

# echo "*** TEST: comparisons that should pass our rules ***"
# init_git_repo
# mkdir ./components
# cp $REPO/components/common.yaml ./components/common.yaml

# mkdir -p ./$SPECS_PATH

# cp $REPO/$SPECS_PATH/000-baseline.yaml ./$SPECS_PATH/comparison-1.yaml
# cp $REPO/$SPECS_PATH/001-ok-add-property-field.yaml ./$SPECS_PATH/comparison-2.yaml
# cp $REPO/$SPECS_PATH/000-fail-naming.yaml ./$SPECS_PATH/comparison-3.yaml
# cp $REPO/$SPECS_PATH/000-batch-post.yaml ./$SPECS_PATH/comparison-4.yaml
# git add .
# git commit -m 'first commit'

# cp $REPO/$SPECS_PATH/001-ok-add-property-field.yaml ./$SPECS_PATH/comparison-1.yaml
# cp $REPO/$SPECS_PATH/002-ok-add-operation.yaml ./$SPECS_PATH/comparison-2.yaml
# cp $REPO/$SPECS_PATH/000-fail-naming.yaml ./$SPECS_PATH/comparison-3.yaml
# cp $REPO/$SPECS_PATH/000-batch-post.yaml ./$SPECS_PATH/comparison-4.yaml
# cp $REPO/$SPECS_PATH/001-singleton.yaml ./$SPECS_PATH/comparison-5.yaml
# cp $REPO/$SPECS_PATH/000-baseline-in-reform.yaml ./$SPECS_PATH/comparison-6.yaml

# git add .
# git commit -m 'second commit'

# ${COMPARE} --check
# assert_ok

# echo "*** TEST: comparisons that should fail our rules; expect failure ***"

# init_git_repo
# mkdir ./components
# cp $REPO/components/common.yaml ./components/common.yaml

# mkdir -p ./$SPECS_PATH

# cp $REPO/$SPECS_PATH/000-baseline-beta.yaml ./$SPECS_PATH/comparison-2.yaml
# cp $REPO/$SPECS_PATH/000-baseline-beta.yaml ./$SPECS_PATH/comparison-3.yaml
# cp $REPO/$SPECS_PATH/000-baseline.yaml ./$SPECS_PATH/comparison-4.yaml
# cp $REPO/$SPECS_PATH/000-baseline.yaml ./$SPECS_PATH/comparison-5.yaml
# cp $REPO/$SPECS_PATH/002-ok-add-operation-beta.yaml ./$SPECS_PATH/comparison-6.yaml
# cp $REPO/$SPECS_PATH/000-baseline.yaml ./$SPECS_PATH/comparison-9.yaml

# git add .
# git commit -m 'first commit'

# cp $REPO/$SPECS_PATH/000-fail-naming.yaml ./$SPECS_PATH/comparison-1.yaml
# cp $REPO/$SPECS_PATH/001-fail-format-change-beta.yaml ./$SPECS_PATH/comparison-2.yaml
# cp $REPO/$SPECS_PATH/001-fail-operation-removed-beta.yaml ./$SPECS_PATH/comparison-3.yaml
# cp $REPO/$SPECS_PATH/001-fail-operationid-change.yaml ./$SPECS_PATH/comparison-4.yaml
# cp $REPO/$SPECS_PATH/001-fail-type-change-beta.yaml ./$SPECS_PATH/comparison-5.yaml
# cp $REPO/$SPECS_PATH/003-fail-type-change-beta.yaml ./$SPECS_PATH/comparison-6.yaml
# cp $REPO/$SPECS_PATH/002-fail-singleton.yaml ./$SPECS_PATH/comparison-7.yaml
# cp $REPO/$SPECS_PATH/002-fail-batch-post.yaml ./$SPECS_PATH/comparison-8.yaml
# cp $REPO/$SPECS_PATH/003-jsonapi.yaml ./$SPECS_PATH/comparison-9.yaml
# cp $REPO/$SPECS_PATH/002-fail-singleton-no-pagination.yaml ./$SPECS_PATH/comparison-10.yaml

# git add .
# git commit -m 'second commit'

# ${COMPARE} --check
# assert_err


echo "*** TEST: diff-all expect failure on invalid api even if no x-optic-url specified if not --upload option ***"

init_git_repo
mkdir ./components
cp $REPO/components/common.yaml ./components/common.yaml

mkdir -p ./$SPECS_PATH

cp $REPO/$SPECS_PATH/005-baseline-no-optic-url.yaml ./$SPECS_PATH/comparison-1.yaml

git add .
git commit -m 'first commit'

cp $REPO/$SPECS_PATH/005-fail-breaking-param-change-beta.yaml ./$SPECS_PATH/comparison-1.yaml
git add .
git commit -m 'second commit'

${COMPARE} --check
assert_err

echo "ALL TESTS OK"
