import fs from "fs";
import path from "path";
import { writeYaml } from "@useoptic/openapi-io";
import { applyTemplate } from "@useoptic/openapi-cli";
import { addCreateOperation } from "./templates/operations/create";
import { addListOperation } from "./templates/operations/list";
import { addGetOperation } from "./templates/operations/get";
import { addUpdateOperation } from "./templates/operations/update";
import { addDeleteOperation } from "./templates/operations/delete";
import { buildNewResourceSpec } from "./templates/new-resource-spec";

export async function createResourceAction(resourceName, pluralResourceName) {
  // TODO: the SDK should probably help with the generation of new files
  // and allow ergonomic use of a SpecTemplate to do so
  const titleResourceName = titleCase(resourceName);
  const version = getResourceVersion();
  const collectionPath = `/${pluralResourceName}`;
  if (!fs.existsSync(path.join(".", "resources")))
    throw new Error(
      "Resource directory does not exist. Are you sure you're in the right directory?",
    );
  await fs.mkdirSync(path.join(".", "resources", pluralResourceName, version), {
    recursive: true,
  });
  const spec = buildNewResourceSpec(titleResourceName);
  const specYaml = writeYaml(spec);
  fs.writeFileSync(
    path.join(".", "resources", pluralResourceName, version, "spec.yaml"),
    specYaml,
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
  return async (
    specFilePath: string,
    resourceName: string,
    pluralResourceName: string,
  ) => {
    const titleResourceName = titleCase(resourceName);
    // TODO: consider how this impacts performance (round trip to the FS for each call)
    // and whether that's something we need to address here
    await applyTemplate(template, specFilePath, {
      pluralResourceName,
      resourceName,
      titleResourceName,
    });
  };
}

//-----

function getResourceVersion(): string {
  const today = new Date();
  return `${today.getFullYear()}-${padWithZero(today.getMonth())}-${padWithZero(
    today.getUTCDay(),
  )}`;
}

function padWithZero(value: number): string {
  return ("00" + value).slice(-2);
}

function titleCase(value: string): string {
  return value[0].toUpperCase() + value.slice(1);
}
