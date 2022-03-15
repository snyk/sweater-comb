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

export async function createResource(resourceName, pluralResourceName) {
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

export async function addOperation(
  specFilePath, // TODO: consider how workflows can provided with more sophisticated context
  operation,
  resourceName,
  pluralResourceName,
) {
  const titleResourceName = titleCase(resourceName);
  const collectionPath = `/${pluralResourceName}`;
  const itemPath = `${collectionPath}/{${resourceName}_id}`;
  switch (operation) {
    case "all":
      // TODO: consider how this impacts performance (round trip to the FS for each call)
      // and whether that's something we need to address here
      await applyTemplate(addCreateOperation, specFilePath, {
        collectionPath,
        resourceName,
        titleResourceName,
      });
      await applyTemplate(addListOperation, specFilePath, {
        collectionPath,
        resourceName,
        titleResourceName,
      });
      await applyTemplate(addGetOperation, specFilePath, {
        itemPath,
        resourceName,
        titleResourceName,
      });
      await applyTemplate(addUpdateOperation, specFilePath, {
        itemPath,
        resourceName,
        titleResourceName,
      });
      await applyTemplate(addDeleteOperation, specFilePath, {
        itemPath,
        resourceName,
        titleResourceName,
      });
      break;
    case "create":
      await applyTemplate(addCreateOperation, specFilePath, {
        collectionPath,
        resourceName,
        titleResourceName,
      });
      break;
    case "get-many":
      await applyTemplate(addListOperation, specFilePath, {
        collectionPath,
        resourceName,
        titleResourceName,
      });
      break;
    case "get-one":
      await applyTemplate(addGetOperation, specFilePath, {
        itemPath,
        resourceName,
        titleResourceName,
      });
      break;
    case "update":
      await applyTemplate(addUpdateOperation, specFilePath, {
        itemPath,
        resourceName,
        titleResourceName,
      });
      break;
    case "delete":
      await applyTemplate(addDeleteOperation, specFilePath, {
        itemPath,
        resourceName,
        titleResourceName,
      });
      break;
  }
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
