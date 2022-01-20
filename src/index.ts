#!/usr/bin/env node

import { makeCiCli } from "@useoptic/api-checks/build/ci-cli/make-cli";
import { newSnykApiCheckService } from "./service";

const apiCheckService = newSnykApiCheckService();
const cli = makeCiCli("sweater-comb", apiCheckService, {
  opticToken: process.env.OPTIC_TOKEN || '',
  gitProvider: {
    token: process.env.GITHUB_TOKEN || '',
    provider: 'github',
  },
  ciProvider: 'circleci',
});

cli.parse(process.argv);
