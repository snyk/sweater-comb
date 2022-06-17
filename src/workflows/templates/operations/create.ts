import {
  commonHeaders,
  commonResponses,
  commonParameters,
  refs,
} from "../common";
import { OpenAPIV3 } from "openapi-types";
import {
  buildCreateRequestSchema,
  buildItemResponseSchema,
  ensureRelationSchemaComponent,
} from "../schemas";
import { SpecTemplate } from "@useoptic/openapi-cli";
import {
  ensureIdParameterComponent,
  ensureOrgIdComponent,
} from "../parameters";
import { buildCollectionPath } from "../paths";
import { getSingularAndPluralName, titleCase } from "../../file-resolvers";
import { AlreadyInSpec, LogAddition } from "../../logs";
import { jsonPointerHelpers } from "@useoptic/json-pointer-helpers";

export const addCreateOperation = SpecTemplate.create(
  "add-create-operation",
  addCreateOperationTemplate,
);

export function addCreateOperationTemplate(
  spec: OpenAPIV3.Document,
  options: {
    pluralResourceName: string;
  },
): void {
  const { pluralResourceName } = options;
  const { singular } = getSingularAndPluralName(spec);
  const titleResourceName = titleCase(singular);
  const collectionPath = buildCollectionPath(pluralResourceName);

  const alreadySet = Boolean(spec.paths[collectionPath]?.post);
  if (alreadySet) return AlreadyInSpec("post", collectionPath);

  if (!spec.paths) spec.paths = {};
  if (!spec.paths[collectionPath]) spec.paths[collectionPath] = {};
  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};
  spec.paths[collectionPath]!.post = buildCreateOperation(
    singular,
    titleResourceName,
  );
  LogAddition(
    "Added Create Operation",
    jsonPointerHelpers.compile(["paths", collectionPath, "post"]),
  );
  const attributes =
    spec.components?.schemas?.[`${titleResourceName}Attributes`];
  if (!attributes)
    throw new Error(`Could not find ${titleResourceName}Attributes schema`);
  spec.components.schemas[`${titleResourceName}CreateAttributes`] = attributes;
  LogAddition(
    `Added ${titleResourceName}Attributes Schema`,
    jsonPointerHelpers.compile([
      "components",
      "schemas",
      `${titleResourceName}Attributes`,
    ]),
  );
  ensureIdParameterComponent(spec, singular, titleResourceName);
  ensureRelationSchemaComponent(spec, titleResourceName);
  ensureOrgIdComponent(spec);
}

function buildCreateOperation(
  resourceName: string,
  titleResourceName: string,
): OpenAPIV3.OperationObject {
  const itemResponseSchema = buildItemResponseSchema(
    resourceName,
    titleResourceName,
  );
  const createRequestSchema = buildCreateRequestSchema(titleResourceName);
  return {
    summary: `Create a new ${resourceName}`,
    description: `Create a new ${resourceName}`,
    operationId: `create${titleResourceName}`,
    tags: [titleResourceName],
    parameters: commonParameters,
    requestBody: {
      content: {
        "application/vnd.api+json": {
          schema: createRequestSchema,
        },
      },
    },
    responses: {
      "201": {
        description: `Created ${resourceName} successfully`,
        headers: { ...commonHeaders, location: refs.headers.location },
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
