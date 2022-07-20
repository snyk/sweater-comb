import findParentDir from "find-parent-dir";
import * as fs from "fs/promises";
import * as path from "path";
import * as util from "util";
import { loadYaml } from "@useoptic/openapi-io";

const findParentDirAsync = util.promisify(findParentDir);

export const lintCommand = async () => {
const vervetConfDir = await findParentDirAsync(
  path.resolve(process.cwd()),
  ".vervet.yaml",
);
if (!vervetConfDir) {
    throw new Error("cannot find .vervet.yaml -- is this a Vervet-managed API project?");
}
const vervetConf = 
}