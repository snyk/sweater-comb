#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

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
import { createLintCommand } from "./lint";

const rulesets = {
  resource: resourceRules,
  compiled: compiledRules,
};

/**
 * readContextFrom returns a rule context object for an OpenAPI spec filename.
 *
 * @param fileName Full path to the OpenAPI spec file.
 * @returns Rule context object suitable for use with sweater-comb API lifecycle rules.
 */
const readContextFrom = (
  fileName: string,
): { date: string; resource: string; stability: string } => {
  const datePath = path.dirname(fileName);
  const date = path.basename(datePath);

  const rcPath = path.dirname(datePath);
  const resource = path.basename(rcPath);

  const specYAML = fs.readFileSync(fileName);
  const spec = yaml.parse(specYAML.toString());
  const stability = spec["x-snyk-api-stability"];
  return { date, resource, stability };
};

const main = async (): Promise<void> => {
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
    generateContext: ({ fileName }) => {
      const { resource, date, stability } = readContextFrom(fileName);
      return {
        changeDate: new Date().toISOString().split("T")[0],
        changeResource: resource,
        changeVersion: {
          date: date,
          stability: stability,
        },
        resourceVersionReleases: {},
      };
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
  cli.addCommand(createLintCommand());

  await cli.exitOverride().parseAsync(process.argv);
};

process.exitCode = 1;
main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err) => {
    console.log("exit on error:", err);
  });
