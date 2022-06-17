import findParentDir from "find-parent-dir";
import * as path from "path";
import * as fs from "fs/promises";
import * as util from "util";
import { loadYaml } from "@useoptic/openapi-io";

const findParentDirAsync = util.promisify(findParentDir);

/**
 * VervetResourcePaths models the resource paths defined in a Vervet project
 * configuration file.
 *
 * For more information, see https://pkg.go.dev/github.com/snyk/vervet/v4/config#Project
 */
export class VervetResourcePaths {
  public readonly defaultResourcesPath: string;
  public readonly resourcesPaths: Set<string>;
  public readonly projectRoot: string;

  /**
   * Create a new instance given the projectRoot directory and Vervet
   * configuration document object.
   */
  constructor(projectRoot: string, doc: any) {
    this.projectRoot = projectRoot;
    const apis = doc?.apis;
    if (!apis) {
      throw new InvalidVervetConfig();
    }
    const resourcesPaths: string[] = [];
    for (const apiName in apis) {
      const resources: Array<{ path: string }> = apis[apiName]?.resources ?? [];
      resources
        .filter((rc) => rc && rc.path && rc.path !== "")
        .forEach((rc) => {
          resourcesPaths.push(rc.path);
        });
    }
    if (resourcesPaths.length == 0) {
      throw new InvalidVervetConfig();
    }
    this.defaultResourcesPath = resourcesPaths[0];
    this.resourcesPaths = new Set(resourcesPaths);
  }
}

class InvalidVervetConfig extends Error {}

export const loadVervetResoucePaths = async (
  fromDir = ".",
): Promise<VervetResourcePaths | null> => {
  const vervetConfDir = await findParentDirAsync(
    path.resolve(fromDir),
    ".vervet.yaml",
  );
  if (!vervetConfDir) {
    return null;
  }
  const vervetConfPath = path.join(vervetConfDir, ".vervet.yaml");
  if (!vervetConfPath) {
    return null;
  }
  try {
    const vervetConfYaml = await fs.readFile(vervetConfPath);
    const vervetDoc = loadYaml(vervetConfYaml.toString());
    const vervetConfig = new VervetResourcePaths(vervetConfDir, vervetDoc);
    return vervetConfig;
  } catch (_err) {
    return null;
  }
};
