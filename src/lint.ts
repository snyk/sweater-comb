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

export const lintAction = async (
  resourceDir?: string,
  branchName?: string,
): Promise<void> => {
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
    console.log("no vervet conf");
    throw new Error(
      "cannot find .vervet.yaml -- is this a Vervet-managed API project?",
    );
  }
  const vervetConfFile = path.join(vervetConfDir, ".vervet.yaml");
  const vervetConfContents = await fs.readFile(vervetConfFile);
  const vervetConf = loadYaml(vervetConfContents.toString()) as VervetConfig;

  const topDir = await findParentDirAsync(vervetConfDir, ".git");
  if (!topDir) {
    console.log("not in a git repository");
    throw new Error("cannot find .git -- is this a cloned git repository?");
  }
  process.chdir(topDir);

  for (const [apiKey, apiValue] of Object.entries(vervetConf.apis)) {
    console.log(`Linting API ${apiKey}`);
    for (const resource of apiValue.resources) {
      if (!resource.linter) {
        console.log(`skipping API ${apiKey}: no linter`);
        continue;
      }
      const linter = vervetConf.linters[resource.linter];
      if (!linter || !linter["optic-ci"]) {
        console.log(`skipping API ${apiKey}: not linted with optic-ci`);
        continue;
      }
      const base = linter["optic-ci"]?.original ?? defaultBranchName;
      await bulkCompare(
        path.join(path.relative(topDir, vervetConfDir), resource.path),
        base,
        resource.excludes,
      );
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

const bulkCompare = async (
  resourceDir: string,
  base: string,
  ignorePatterns: string[] = [],
): Promise<void> => {
  const opticScript = await resolveOpticScript();
  const extraArgs: string[] = [];
  if (ignorePatterns.length > 0) {
    extraArgs.push("--ignore", ignorePatterns.join(","));
  }
  const args = [
    opticScript,
    "bulk-compare",
    "--glob",
    `${resourceDir}/**/[2-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]/spec.yaml`,
    "--base",
    base,
    ...extraArgs,
  ];
  return new Promise<void>((resolve, reject) => {
    const child = child_process.spawn(process.argv0, args, {
      env: {
        ...process.env,
      },
      stdio: "inherit",
    });
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
