import * as axios from "axios";

import { loadSpecFromUrl } from "@useoptic/openapi-io";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { compiledRules } from "../rulesets";
import { Config } from "./config";

/**
 * Checker runs API standards compliance checks on the service container
 * proposed for deployment, in comparison to the current deployed service, if
 * applicable.
 */
export class Checker {
  private readonly proposedBaseURL: string;
  private readonly currentBaseURL: string | undefined;
  private readonly proposedClient: axios.AxiosInstance;

  constructor(config: Config) {
    this.proposedBaseURL = config.proposedBaseURL;
    this.currentBaseURL = config.currentBaseURL;
    this.proposedClient = axios.default.create({
      baseURL: config.proposedBaseURL,
    });
  }

  /**
   * checkApis checks each public API for standards compliance which is
   * published by the proposed service container.
   */
  async checkApis() {
    // Connect to /api-discovery. Find all the APIs.
    const apisResp = await this.proposedClient.get("/api-discovery");
    if (apisResp.status !== 200) {
      throw new Error("failed to obtain APIs");
    }
    const apis = apisResp.data.apis;
    for (const api of apis) {
      await this.checkApi(api);
    }
  }

  /**
   * checkApi checks each public OpenAPI version published by the proposed
   * service container, of beta or GA stability.
   * @param api
   * @returns
   */
  private async checkApi(api: {
    path: string;
    type: string;
    visibility: string;
  }) {
    if (api.visibility !== "public") {
      return;
    }
    if (api.type !== "openapi") {
      return;
    }
    if (!api.path) {
      return;
    }
    const versionsResp = await this.proposedClient.get(`${api.path}/openapi`);
    if (versionsResp.status !== 200) {
      throw new Error("failed to obtain OpenAPI versions");
    }
    const versions: [string] = versionsResp.data;
    for (const version of versions) {
      if (!version.match(/^\d\d\d\d-\d\d-\d\d(~beta)?$/)) {
        console.log("skipping version", version);
        continue;
      }
      console.log(`checking api ${api.path} version ${version}`);
      await this.checkVersion(`${api.path}/openapi/${version}`, version);
    }
  }

  private readonly ruleRunner = new RuleRunner(compiledRules);

  async checkVersion(url: string, version: string): Promise<void> {
    const proposedBase = (
      await loadSpecFromUrl(`${this.proposedBaseURL}${url}`, true)
    ).flattened!;
    // TODO: If currentBaseURL 404s, that just means this is a new version
    const currentBase = this.currentBaseURL
      ? (await loadSpecFromUrl(`${this.currentBaseURL}${url}`, true)).flattened!
      : TestHelpers.createEmptySpec();
    // TODO: Also need to check for sunset versions -- so this isn't quite correct yet!
    //       This will require a refactoring.
    const versionParts = version.split("~");
    const [versionDate, versionStability] = versionParts;
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(currentBase, proposedBase),
      context: {
        changeVersion: {
          date: versionDate,
          stability: versionStability ?? "ga",
        },
      },
    };
    const results = this.ruleRunner.runRulesWithFacts(ruleInputs);

    if (!results.every((result) => result.passed)) {
      console.log(results.filter((result) => !result.passed));
      throw new Error(`${version} failed`);
    }

    console.log(`${version} passed`);
  }
}
