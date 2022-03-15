#!/usr/bin/env node

import { makeCiCli } from "@useoptic/api-checks/build/ci-cli/make-cli";
import { newSnykApiCheckService } from "./service";
import { Command } from "commander";
import {
  addOperationCommand,
  createResourceCommand,
} from "./workflows/commands";

const apiCheckService = newSnykApiCheckService();
const cli = makeCiCli("sweater-comb", apiCheckService, {
  opticToken: process.env.OPTIC_TOKEN || "",
  gitProvider: {
    token: process.env.GITHUB_TOKEN || "",
    provider: "github",
  },
  ciProvider: "circleci",
});

const workflowCommand = new Command("workflow").description(
  "workflows for designing and building APIs",
);
workflowCommand.addCommand(createResourceCommand());
workflowCommand.addCommand(addOperationCommand());
cli.addCommand(workflowCommand);

cli.parse(process.argv);
