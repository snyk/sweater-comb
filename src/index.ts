#!/usr/bin/env node

import { initializeCli } from "@useoptic/optic-ci/build/initialize";
import { rules } from "./rulesets";
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

(async () => {
  const cli = await initializeCli({
    token: process.env.OPTIC_TOKEN || "",
    gitProvider: {
      token: process.env.GITHUB_TOKEN || "",
    },
    rules: rules,
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
