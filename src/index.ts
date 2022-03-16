#!/usr/bin/env node

import { makeCiCli } from "@useoptic/api-checks/build/ci-cli/make-cli";
import { newSnykApiCheckService } from "./service";
import { Command } from "commander";
import {
  createResourceCommand,
  addCreateOperationCommand,
  addUpdateOperationCommand,
  addDeleteOperationCommand,
  addGetOperationCommand,
  addListOperationCommand,
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

const operationCommand = new Command("operation").description(
  "add common operations to an OpenAPI file",
);
const operationCommands = [
  addCreateOperationCommand,
  addDeleteOperationCommand,
  addGetOperationCommand,
  addListOperationCommand,
  addUpdateOperationCommand,
];
operationCommands.forEach((command) => operationCommand.addCommand(command));

workflowCommand.addCommand(operationCommand);
cli.addCommand(workflowCommand);

cli.parse(process.argv);
