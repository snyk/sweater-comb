import {
  commonHeaders,
  commonParameters,
  commonResponses,
  refs,
} from "../common";
import {
  ensureIdParameterComponent,
  ensureOrgIdComponent,
} from "../parameters";
import {
  buildItemResponseSchema,
  buildUpdateRequestSchema,
  ensureRelationSchemaComponent,
} from "../schemas";
import { OpenAPIV3 } from "openapi-types";
import { SpecTemplate } from "@useoptic/openapi-cli";
import { buildItemPath } from "../paths";
import { getSingularAndPluralName, titleCase } from "../../file-resolvers";
import { AlreadyInSpec, LogAddition } from "../../logs";
import { jsonPointerHelpers } from "@useoptic/json-pointer-helpers";

export const addUpdateOperation = SpecTemplate.create(
  "add-update-operation",
  addUpdateOperationTemplate,
);

export function addUpdateOperationTemplate(
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
  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};

  const alreadySet = Boolean(spec.paths[itemPath]?.patch);
  if (alreadySet) return AlreadyInSpec("patch", itemPath);

  spec.paths[itemPath]!.patch = buildUpdateOperation(
    singular,
    titleResourceName,
  );

  LogAddition(
    "Added Update by ID Operation",
    jsonPointerHelpers.compile(["paths", itemPath, "patch"]),
  );

  const attributes =
    spec.components?.schemas?.[`${titleResourceName}Attributes`];
  if (!attributes)
    throw new Error(`Could not find ${titleResourceName}Attributes schema`);
  spec.components.schemas[`${titleResourceName}UpdateAttributes`] = attributes;

  LogAddition(
    `Added ${titleResourceName}UpdateAttributes Schema`,
    jsonPointerHelpers.compile([
      "components",
      "schemas",
      `${titleResourceName}UpdateAttributes`,
    ]),
  );

  ensureIdParameterComponent(spec, singular, titleResourceName);
  ensureRelationSchemaComponent(spec, titleResourceName);
  ensureOrgIdComponent(spec);
}

function buildUpdateOperation(
  resourceName: string,
  titleResourceName: string,
): OpenAPIV3.OperationObject {
  const itemResponseSchema = buildItemResponseSchema(
    resourceName,
    titleResourceName,
  );
  const updateRequestSchema = buildUpdateRequestSchema(titleResourceName);
  return {
    summary: `Update an instance of ${resourceName}`,
    description: `Update an instance of ${resourceName}`,
    operationId: `update${titleResourceName}`,
    tags: [titleResourceName],
    parameters: [
      ...commonParameters,
      { $ref: `#/components/parameters/${titleResourceName}Id` },
    ],
    requestBody: {
      content: {
        "application/vnd.api+json": {
          schema: updateRequestSchema,
        },
      },
    },
    responses: {
      "200": {
        description: `Instance of ${resourceName} is updated`,
        headers: commonHeaders,
        content: {
          "application/vnd.api+json": {
            schema: itemResponseSchema,
          },
        },
      },
      "204": refs.responses["204"],
      ...commonResponses,
    },
  };
}
