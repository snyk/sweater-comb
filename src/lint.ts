import findParentDir from "find-parent-dir";
import * as fs from "fs/promises";
import * as path from "path";
import * as util from "util";
import * as child_process from "child_process";
import { loadYaml } from "@useoptic/openapi-io";

const findParentDirAsync = util.promisify(findParentDir);

type VervetConfig = {
  linters: {
    [linterKey: string]: {
      "optic-ci"?: {
        original?: string;
      };
    };
  };
  apis: {
    [apiKey: string]: {
      resources: Array<{
        path: string;
        linter?: string;
      }>;
    };
  };
};

export const lintCommand = async () => {
  const vervetConfDir = await findParentDirAsync(
    path.resolve(process.cwd()),
    ".vervet.yaml",
  );
  if (!vervetConfDir) {
    throw new Error(
      "cannot find .vervet.yaml -- is this a Vervet-managed API project?",
    );
  }
  const vervetConfFile = path.join(vervetConfDir, ".vervet.yaml");
  const vervetConfContents = await fs.readFile(vervetConfFile);
  const vervetConf = loadYaml(vervetConfContents.toString()) as VervetConfig;

  for (const [apiKey, apiValue] of Object.entries(vervetConf.apis)) {
    for (const resource of apiValue.resources) {
      if (!resource.linter) {
        continue;
      }
      const linter = vervetConf.linters[resource.linter];
      const base = linter["optic-ci"]?.original;
      if (!base) {
        continue;
      }
      console.log(`linting API ${apiKey}`);
      await bulkCompare(resource.path, base);
    }
  }
  // TODO: get APIs out of vervetConf
  // TODO: match w/selected API (or do all of them)
  // TODO: figure out which rulesets for which APIs
  // TODO: run bulk-compare for each API
};

const bulkCompare = async (resourceDir: string, base: string) => {
  const opticScript = await resolveOpticScript();
  await new Promise<void>((resolve, reject) => {
    const child = child_process.spawn(
      process.argv0,
      [
        opticScript,
        "bulk-compare",
        "--glob",
        `${resourceDir}/**/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/spec.yaml`,
        "--base",
        base,
      ],
      {
        env: {
          ...process.env,
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
        reject(
          new Error(
            `bulk-compare ${resourceDir} failed with exit code ${code}`,
          ),
        );
      }
    });
  });
};

const resolveOpticScript = async (): Promise<string> => {
  for (const script of [
    path.join(__dirname, "../build/index.js"),
    path.join(__dirname, "index.js"),
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
