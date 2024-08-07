#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

import {
  initCli,
  setRulesets,
  setGenerateContext,
} from "@useoptic/optic/build/lib";
import { resourceRules, compiledRules } from "./rulesets/rest/2022-05-25";
import { program } from "commander";
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
): {
  changeDate: string;
  changeResource: string;
  changeVersion: {
    date: string;
    stability: string;
  };
  resourceVersionReleases: Record<string, any>;
} => {
  const datePath = path.dirname(fileName);
  const date = path.basename(datePath);

  const rcPath = path.dirname(datePath);
  const resource = path.basename(rcPath);

  try {
    const specYAML = fs.readFileSync(fileName);
    const spec = yaml.parse(specYAML.toString());
    const stability = spec["x-snyk-api-stability"];

    return {
      changeDate: new Date().toISOString().split("T")[0],
      changeResource: resource,
      changeVersion: {
        date: date,
        stability: stability,
      },
      resourceVersionReleases: {},
    };
  } catch (e) {
    return {
      changeDate: new Date().toISOString().split("T")[0],
      changeResource: resource,
      changeVersion: {
        date: date,
        stability: "",
      },
      resourceVersionReleases: {},
    };
  }
};

const main = async (): Promise<void> => {
  program.addCommand(createLintCommand());

  const cli = await initCli(program, { hideNotifier: true });
  const ruleset =
    rulesets[process.env.SWEATER_COMB_RULESET || ""] ?? resourceRules;
  setRulesets(ruleset);
  setGenerateContext(readContextFrom);

  await cli.exitOverride().parseAsync(process.argv);
};

main().catch((err) => {
  if (["commander.helpDisplayed", "commander.version"].includes(err.code)) {
    process.exitCode = 0;
    return;
  }
  process.exitCode = 1;
  console.log("exit on error:", err);
});
