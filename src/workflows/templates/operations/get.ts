import {
  ensureIdParameterComponent,
  ensureOrgIdComponent,
} from "../parameters";
import {
  buildItemResponseSchema,
  ensureRelationSchemaComponent,
} from "../schemas";
import { commonHeaders, commonParameters, commonResponses } from "../common";
import { OpenAPIV3 } from "openapi-types";
import { SpecTemplate } from "@useoptic/openapi-cli";
import { buildItemPath } from "../paths";
import { getSingularAndPluralName, titleCase } from "../../file-resolvers";
import { AlreadyInSpec, LogAddition } from "../../logs";
import { jsonPointerHelpers } from "@useoptic/json-pointer-helpers";

export const addGetOperation = SpecTemplate.create(
  "add-get-operation",
  addGetOperationTemplate,
);

export function addGetOperationTemplate(
  spec: OpenAPIV3.Document,
  options: {
    pluralResourceName: string;
  },
): void {
  const { pluralResourceName } = options;
  const { singular } = getSingularAndPluralName(spec);
  const titleResourceName = titleCase(singular);
  const itemPath = buildItemPath(singular, pluralResourceName);
  if (!spec.paths) spec.paths = {};
  if (!spec.paths[itemPath]) spec.paths[itemPath] = {};

  const alreadySet = Boolean(spec.paths[itemPath]?.get);
  if (alreadySet) return AlreadyInSpec("get", itemPath);

  spec.paths[itemPath]!.get = buildGetOperation(singular, titleResourceName);

  LogAddition(
    "Added Get Resource by ID Operation",
    jsonPointerHelpers.compile(["paths", itemPath, "get"]),
  );

  ensureIdParameterComponent(spec, singular, titleResourceName);
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
