import fs from "fs-extra";
import path from "path";
import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { loadVervetResoucePaths } from "./vervet-resolver";

export async function resolveResourcesDirectory(
  workingDirectory: string = getSweaterCombWorkingDirectory(),
): Promise<string | undefined> {
  const vervetPaths = await loadVervetResoucePaths(workingDirectory);
  if (!vervetPaths) {
    return undefined;
  }
  const resolvedWorkingDirectory = path.resolve(workingDirectory);
  for (const rcPath of vervetPaths.resourcesPaths.values()) {
    const absRcPath = path.resolve(path.join(vervetPaths.projectRoot, rcPath));
    if (resolvedWorkingDirectory.startsWith(absRcPath)) {
      return absRcPath;
    }
  }
  return path.join(vervetPaths.projectRoot, vervetPaths.defaultResourcesPath);
}

export type ResourceVersionLookupResults =
  | {
      succeeded: {
        path: string;
        matchedResource: string;
        matchedVersion: string;
        resourcesDirectory: string;
      };
    }
  | {
      failed: {
        availableResources: string[];
        availableVersions: string[];
        resourcesDirectory?: string;
        matchedResource?: string;
        matchedVersion?: string;
      };
    };

export async function resolveResourceVersion(
  workingDirectory: string = getSweaterCombWorkingDirectory(),
  resourceName: string,
  resourceVersion = "latest",
): Promise<ResourceVersionLookupResults> {
  const resources = await resolveResourcesDirectory(workingDirectory);

  if (typeof resources === "undefined") {
    return {
      failed: {
        availableResources: [],
        availableVersions: [],
      },
    };
  }

  const resourceNameLowerCase = resourceName.toLowerCase();

  const resourceNames = (await fs.readdir(resources)).filter((maybeResource) =>
    fs.lstatSync(path.join(resources!, maybeResource)).isDirectory(),
  );

  if (!resourceNames.includes(resourceNameLowerCase)) {
    return {
      failed: {
        availableResources: resourceNames.sort(),
        availableVersions: [],
        resourcesDirectory: resources,
      },
    };
  }

  const resourceDir = path.join(resources, resourceNameLowerCase);
  const isDirectory = fs.lstatSync(resourceDir).isDirectory();
  const versions = isDirectory
    ? (await fs.readdir(resourceDir)).filter((name) =>
        Boolean(name.match(/\d\d\d\d-\d\d-\d\d/)),
      )
    : [];

  const matchingDate =
    resourceVersion !== "latest"
      ? versions.find((date) => date === resourceVersion)
      : latestDateOfSet(versions);

  if (!matchingDate) {
    return {
      failed: {
        availableResources: resourceNames.sort(),
        availableVersions: versions.sort(),
        resourcesDirectory: resources,
        matchedResource: resourceNameLowerCase,
      },
    };
  }

  const finalPath = path.join(
    resources,
    resourceNameLowerCase,
    matchingDate,
    "spec.yaml",
  );

  return {
    succeeded: {
      path: finalPath,
      matchedResource: resourceName,
      matchedVersion: matchingDate,
      resourcesDirectory: resources,
    },
  };
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

export function getSweaterCombWorkingDirectory() {
  return process.env["SWEATER_COMB_WORKING_DIR"] || process.cwd();
}
