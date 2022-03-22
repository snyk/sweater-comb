# Run this file as source local-testing.sh from sweater-comb root, then you can run sweater-comb-local anywhere during testing :)
CURRENT_ROOT=$(pwd)
alias sweater-comb-local='ts-node $CURRENT_ROOT/src/index.ts'
