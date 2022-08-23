import findParentDir from "find-parent-dir";
import * as fs from "fs/promises";
import * as path from "path";
import * as util from "util";
import * as child_process from "child_process";
import { loadYaml } from "@useoptic/openapi-io";
import { Argument, Command } from "commander";

const findParentDirAsync = util.promisify(findParentDir);

type VervetConfig = {
  linters: {
    [linterKey: string]: {
      "optic-ci"?: {
        original?: string;
        script?: string;
        exceptions?: {
          [key: string]: string[];
        };
      };
    };
  };
  apis: {
    [apiKey: string]: {
      resources: Array<{
        path: string;
        linter?: string;
        excludes?: string[];
      }>;
    };
  };
};

const defaultBranchName = "main";

export const lintAction = async (resourceDir?: string, branchName?: string) => {
  if (resourceDir) {
    await bulkCompare(resourceDir, branchName ?? defaultBranchName);
    return;
  }

  console.log(
    "no arguments given, defaulting to Vervet API project configuration",
  );
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
    console.log(`Linting API ${apiKey}`);
    for (const resource of apiValue.resources) {
      if (!resource.linter) {
        console.log(`skipping API ${apiKey}: no linter`);
        continue;
      }
      if (resource.excludes) {
        throw new Error("vervet resource exclude paths are not supported");
      }
      const linter = vervetConf.linters[resource.linter];
      if (!linter || !linter["optic-ci"]) {
        console.log(`skipping API ${apiKey}: not linted with optic-ci`);
        continue;
      }
      const base = linter["optic-ci"]?.original ?? defaultBranchName;
      await bulkCompare(resource.path, base);
    }
  }
};

export const createLintCommand = () => {
  const command = new Command("lint")
    .addArgument(new Argument("path", "API resource path").argOptional())
    .addArgument(
      new Argument("base", "base git branch for comparison")
        .argOptional()
        .default(defaultBranchName),
    )
    .action(lintAction);
  command.description("lint APIs in current project");
  return command;
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
        `${resourceDir}/**/[2-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]/spec.yaml`,
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
