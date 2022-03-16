import { commonParameters, commonResponses, refs } from "../common";
import {
  ensureIdParameterComponent,
  ensureOrgIdComponent,
} from "../parameters";
import { OpenAPIV3 } from "openapi-types";
import { SpecTemplate } from "@useoptic/openapi-cli";
import { ensureRelationSchemaComponent } from "../schemas";
import { buildItemPath } from "../paths";

export const addDeleteOperation = SpecTemplate.create(
  "add-delete-operation",
  addDeleteOperationTemplate,
);

export function addDeleteOperationTemplate(
  spec: OpenAPIV3.Document,
  options: {
    resourceName: string;
    titleResourceName: string;
    pluralResourceName: string;
  },
): void {
  const { resourceName, titleResourceName, pluralResourceName } = options;
  const itemPath = buildItemPath(resourceName, pluralResourceName);
  if (!spec.paths) spec.paths = {};
  if (!spec.paths[itemPath]) spec.paths[itemPath] = {};
  spec.paths[itemPath]!.delete = buildDeleteOperation(
    resourceName,
    titleResourceName,
  );
  ensureIdParameterComponent(spec, resourceName, titleResourceName);
  ensureRelationSchemaComponent(spec, titleResourceName);
  ensureOrgIdComponent(spec);
}

function buildDeleteOperation(
  resourceName: string,
  titleResourceName: string,
): OpenAPIV3.OperationObject {
  return {
    summary: `Delete an instance of ${resourceName}`,
    description: `Delete an instance of ${resourceName}`,
    operationId: `delete${titleResourceName}`,
    tags: [titleResourceName],
    parameters: [
      ...commonParameters,
      { $ref: `#/components/parameters/${titleResourceName}Id` },
    ],
    responses: {
      "204": refs.responses["204"],
      ...commonResponses,
    },
  };
}
