#!/usr/bin/env node

import { makeCiCliWithNamedRules } from "@useoptic/api-checks/build/ci-cli/make-cli";
import { v3Rules } from "./v3-rules";
// import { internalApiRules } from './internal-api-rules';

const cli = makeCiCliWithNamedRules("sweater-comb", {
  default: v3Rules(),
  "v3-apis": v3Rules(),
  // "internal-apis": internalApiRules(),
});

cli.parse(process.argv);
