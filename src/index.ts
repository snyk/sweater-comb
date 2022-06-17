#!/usr/bin/env node

import { initializeCli } from "@useoptic/optic-ci/build/initialize";
import { resourceRules, compiledRules } from "./rulesets/rest/2022-05-25";
import { Command } from "commander";
import {
  createResourceCommand,
  addCreateOperationCommand,
  addUpdateOperationCommand,
  addDeleteOperationCommand,
  addGetOperationCommand,
  addListOperationCommand,
  createVersionCommand,
  createUpdateCommand,
} from "./workflows/commands";

const rulesets = {
  resource: resourceRules,
  compiled: compiledRules,
};

(async () => {
  const cli = await initializeCli({
    token: process.env.OPTIC_TOKEN || "",
    gitProvider: {
      token: process.env.GITHUB_TOKEN || "",
    },
    rules: rulesets[process.env.SWEATER_COMB_RULESET || ""] ?? resourceRules,
    spectralConfig: {
      "openapi-tags": "off",
      "operation-tags": "off",
      "info-contact": "off",
      "info-description": "off",
      "info-license": "off",
      "license-url": "off",
      "oas3-unused-component": "off",
    },
  });

  const workflowCommand = new Command("workflow").description(
    "workflows for designing and building APIs",
  );
  workflowCommand.addCommand(createResourceCommand());

  workflowCommand.addCommand(createVersionCommand());

  workflowCommand.addCommand(createUpdateCommand());

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
})();
