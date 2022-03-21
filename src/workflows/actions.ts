import fs from "fs-extra";
import path from "path";
import { writeYaml, loadYaml } from "@useoptic/openapi-io";
import { applyTemplate } from "@useoptic/openapi-cli";
import { addCreateOperation } from "./templates/operations/create";
import { addListOperation } from "./templates/operations/list";
import { addGetOperation } from "./templates/operations/get";
import { addUpdateOperation } from "./templates/operations/update";
import { addDeleteOperation } from "./templates/operations/delete";
import { buildNewResourceSpec } from "./templates/new-resource-spec";
import {
  formatResourceVersion,
  resolveResourcesDirectory,
  resolveResourceVersion,
} from "./file-resolvers";
import {
  LogNewDateVersionSpecification,
  LogUpdatingSpecification,
} from "./logs";
import { OpenAPIV3 } from "@useoptic/openapi-utilities";

export async function createResourceAction(resourceName, pluralResourceName) {
  // TODO: the SDK should probably help with the generation of new files
  // and allow ergonomic use of a SpecTemplate to do so
  const titleResourceName = titleCase(resourceName);
  const version = formatResourceVersion();

  const resourcesDirectory = await resolveResourcesDirectory();
  const lowerCaseResourceName = pluralResourceName.toLowerCase();

  await fs.mkdirSync(
    path.join(resourcesDirectory, lowerCaseResourceName, version),
    {
      recursive: true,
    },
  );

  const initialSpecFilePath = path.join(
    resourcesDirectory,
    lowerCaseResourceName,
    version,
    "spec.yaml",
  );

  LogUpdatingSpecification(pluralResourceName, "latest", initialSpecFilePath);

  const spec = buildNewResourceSpec(
    titleResourceName,
    resourceName,
    pluralResourceName,
  );

  const specYaml = writeYaml(spec);
  fs.writeFileSync(initialSpecFilePath, specYaml);
}

export async function promoteVersionAction(
  resourceName: string,
  targetStability: string,
) {
  const stabilityProgression = ["wip", "experimental", "beta", "ga"];

  if (!stabilityProgression.includes(targetStability))
    throw new Error(
      `target stability must be one of ${JSON.stringify(stabilityProgression)}`,
    );

  const specFilePath = await resolveResourceVersion(
    process.cwd(),
    resourceName,
    "latest",
    true,
  );

  const currentDateVersion = (() => {
    const components = specFilePath.split("/");
    components.pop(); // spec.yaml
    return components.pop(); // date string
  })();

  const openAPI: OpenAPIV3.Document = loadYaml(
    (await fs.readFile(specFilePath)).toString(),
  ) as OpenAPIV3.Document;

  const currentStability = openAPI["x-snyk-api-stability"];

  if (
    stabilityProgression.indexOf(currentStability) >
    stabilityProgression.indexOf(targetStability)
  )
    throw new Error(
      `stability can not go backwards from ${currentStability} to ${targetStability}`,
    );

  if (formatResourceVersion() === currentDateVersion)
    throw new Error(
      `can not promote stability on the same day as the latest version ${currentDateVersion}`,
    );

  // advance the stability, while copying everything else over
  openAPI["x-snyk-api-stability"] = targetStability;

  const resourcesDirectory = await resolveResourcesDirectory();

  const newDateVersion = formatResourceVersion();

  await fs.mkdirSync(
    path.join(resourcesDirectory, resourceName, newDateVersion),
    {
      recursive: true,
    },
  );

  const initialSpecFilePath = path.join(
    resourcesDirectory,
    resourceName,
    newDateVersion,
    "spec.yaml",
  );

  const specYaml = writeYaml(openAPI);
  fs.writeFileSync(initialSpecFilePath, specYaml);

  LogNewDateVersionSpecification(
    resourceName,
    newDateVersion,
    targetStability,
    initialSpecFilePath,
  );
}

export const addCreateOperationAction =
  buildOperationAction(addCreateOperation);
export const addDeleteOperationAction =
  buildOperationAction(addDeleteOperation);
export const addGetOperationAction = buildOperationAction(addGetOperation);
export const addListOperationAction = buildOperationAction(addListOperation);
export const addUpdateOperationAction =
  buildOperationAction(addUpdateOperation);

function buildOperationAction(template) {
  // TODO: consider how workflows can provided with more sophisticated context
  return async (pluralResourceName: string, resourceVersion: string) => {
    const specFilePath = await resolveResourceVersion(
      process.cwd(),
      pluralResourceName,
      resourceVersion,
    );
    // TODO: consider how this impacts performance (round trip to the FS for each call)
    // and whether that's something we need to address here
    await applyTemplate(template, specFilePath, {
      pluralResourceName,
    });
  };
}

//-----

function titleCase(value: string): string {
  return value[0].toUpperCase() + value.slice(1);
}
