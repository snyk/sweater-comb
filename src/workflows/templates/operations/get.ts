import {
  ensureIdParameterComponent,
  ensureOrgIdComponent,
} from "../parameters";
import {
  buildItemResponseSchema,
  ensureRelationSchemaComponent,
} from "../schemas";
import {
  commonHeaders,
  commonParameters,
  commonResponses,
  refs,
} from "../common";
import { OpenAPIV3 } from "openapi-types";
import { SpecTemplate } from "@useoptic/openapi-cli";
import { buildItemPath } from "../paths";

export const addGetOperation = SpecTemplate.create(
  "add-get-operation",
  addGetOperationTemplate,
);

export function addGetOperationTemplate(
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
  spec.paths[itemPath]!.get = buildGetOperation(
    resourceName,
    titleResourceName,
  );
  ensureIdParameterComponent(spec, resourceName, titleResourceName);
  ensureRelationSchemaComponent(spec, titleResourceName);
  ensureOrgIdComponent(spec);
}

function buildGetOperation(
  resourceName: string,
  titleResourceName: string,
): OpenAPIV3.OperationObject {
  const itemResponseSchema = buildItemResponseSchema(
    resourceName,
    titleResourceName,
  );
  return {
    summary: `Get instance of ${resourceName}`,
    description: `Get instance of ${resourceName}`,
    operationId: `get${titleResourceName}`,
    tags: [titleResourceName],
    parameters: [
      ...commonParameters,
      { $ref: `#/components/parameters/${titleResourceName}Id` },
    ],
    responses: {
      "200": {
        description: `Returns an instance of ${resourceName}`,
        headers: commonHeaders,
        content: {
          "application/vnd.api+json": {
            schema: itemResponseSchema,
          },
        },
      },
      ...commonResponses,
    },
  };
}
