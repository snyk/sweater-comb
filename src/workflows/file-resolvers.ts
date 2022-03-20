import findParentDir from "find-parent-dir";
import fs from "fs-extra";
import path from "path";
import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { LogUpdatingSpecification } from "./cli-ux";

export async function resolveResourcesDirectory(
  workingDirectory: string = process.cwd(),
): Promise<string> {
  return new Promise((resolve) => {
    findParentDir(workingDirectory, "resources", function (err, dir) {
      if (err)
        throw new Error(
          "A Vervet resources directory does not exist here. Is your working directory correct?",
        );
      resolve(path.join(dir, "resources"));
    });
  });
}

export async function resolveResourceVersion(
  workingDirectory: string = process.cwd(),
  resourceName: string,
  resourceVersion: string = "latest",
): Promise<string> {
  const resources = await resolveResourcesDirectory();
  const resourceNameLowerCase = resourceName.toLowerCase();

  const resourceNames = await fs.readdir(resources);

  if (!resourceNames.includes(resourceNameLowerCase))
    throw new Error(
      `No resource ${resourceNameLowerCase} found in directory ${resources}`,
    );

  const resourceDir = path.join(resources, resourceNameLowerCase);
  const versions = await fs.readdir(resourceDir);

  const matchingDate =
    resourceVersion !== "latest"
      ? versions.find((date) => date === resourceVersion)
      : latestDateOfSet(versions);

  if (!matchingDate)
    throw new Error(
      `No resource version ${resourceVersion} found for ${resourceNameLowerCase}`,
    );

  const finalPath = path.join(
    resources,
    resourceNameLowerCase,
    matchingDate,
    "spec.yaml",
  );

  LogUpdatingSpecification(resourceName, resourceVersion, finalPath);
  return finalPath;
}

function latestDateOfSet(dates: string[]): string | undefined {
  return dates.sort().pop();
}

export function formatResourceVersion(date: Date = new Date()): string {
  return `${date.getFullYear()}-${padWithZero(
    date.getMonth() + 1,
  )}-${padWithZero(date.getDate())}`;
}

function padWithZero(value: number): string {
  return ("00" + value).slice(-2);
}

export function getSingularAndPluralName(openApi: OpenAPIV3.Document) {
  const singular = openApi.info["x-singular-name"];
  const plural = openApi.info["x-plural-name"];

  if (!singular || !plural)
    throw new Error(
      "info.x-singular-name and info.x-plural-name must be set to use our OpenAPI workflow generators ",
    );

  return { singular, plural };
}

export function titleCase(value: string): string {
  return value[0].toUpperCase() + value.slice(1);
}
