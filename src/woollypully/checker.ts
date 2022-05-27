import * as axios from "axios";
import * as child_process from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { Config } from "./config";

/**
 * Checker runs API standards compliance checks on the service container
 * proposed for deployment, in comparison to the current deployed service, if
 * applicable.
 */
export class Checker {
  private readonly proposedClient: axios.AxiosInstance;
  private readonly currentClient?: axios.AxiosInstance;

  constructor(config: Config) {
    this.proposedClient = axios.default.create({
      baseURL: config.proposedBaseURL,
    });
    if (config.currentBaseURL) {
      this.currentClient = axios.default.create({
        baseURL: config.currentBaseURL,
      });
    }
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
      await this.checkVersion(api, version);
    }
  }

  async checkVersion(
    api: {
      path: string;
      type: string;
      visibility: string;
    },
    version: string,
  ): Promise<void> {
    const versionParts = version.split("~");
    const [versionDate, versionStability] = versionParts;
    const { tmpdir, currentSpecPath, proposedSpecPath } = await this.fetchSpecs(
      `${api.path}/openapi/${version}`,
    );
    try {
      const fromArgs = currentSpecPath ? ["--from", currentSpecPath] : [];
      const args = [
        "compare",
        ...fromArgs,
        "--to",
        proposedSpecPath,
        "--context",
        JSON.stringify({
          changeVersion: {
            date: versionDate,
            stability: versionStability ?? "ga",
          },
        }),
      ];
      const opticScript = await resolveOpticScript();
      await new Promise<void>((resolve, reject) => {
        const child = child_process.spawn(
          process.argv0,
          [opticScript, ...args],
          {
            env: {
              ...process.env,
              SWEATER_COMB_RULESET: "compiled",
            },
            stdio: "inherit",
          },
        );
        child.on("error", (err) => {
          reject(err);
        });
        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`check ${version} failed with exit code ${code}`));
          }
        });
      });
    } finally {
      try {
        await fs.rm(tmpdir, { force: true, recursive: true });
      } catch (err) {
        console.log("failed to clean up", tmpdir);
      }
    }
  }

  private async fetchSpecs(versionPath: string): Promise<{
    tmpdir: string;
    currentSpecPath?: string;
    proposedSpecPath: string;
  }> {
    const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "woollypully"));
    try {
      const currentSpecPath = this.currentClient
        ? await this.fetchSpec(tmpdir, this.currentClient, versionPath)
        : undefined;
      const proposedSpecPath = await this.fetchSpec(
        tmpdir,
        this.proposedClient,
        versionPath,
      );
      return { tmpdir, currentSpecPath, proposedSpecPath };
    } catch (err) {
      try {
        await fs.rm(tmpdir, { force: true, recursive: true });
      } catch (err) {
        console.log("failed to clean up", tmpdir);
      }
      throw err;
    }
  }

  private async fetchSpec(
    tmpdir: string,
    client: axios.AxiosInstance,
    versionPath: string,
  ): Promise<string> {
    const resp = await client.get(versionPath);
    if (resp.status !== 200) {
      throw new Error(`failed to get OpenAPI spec: HTTP ${resp.status}`);
    }
    const specFile = path.join(tmpdir, "proposed.json");
    await fs.writeFile(specFile, JSON.stringify(resp.data));
    return specFile;
  }
}
const resolveOpticScript = async (): Promise<string> => {
  for (const script of [
    path.join(__dirname, "../../build/index.js"),
    path.join(__dirname, "../index.js"),
  ]) {
    try {
      await fs.stat(script);
      return script;
    } catch (err) {
      continue;
    }
  }
  throw new Error("failed to locate optic-ci script");
};
