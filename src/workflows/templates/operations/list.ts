import { OpenAPIV3 } from "openapi-types";
import {
  buildCollectionResponseSchema,
  ensureRelationSchemaComponent,
} from "../schemas";
import {
  commonHeaders,
  commonParameters,
  commonResponses,
  paginationParameters,
  refs,
} from "../common";
import { SpecTemplate } from "@useoptic/openapi-cli";
import { ensureOrgIdComponent } from "../parameters";
import { buildCollectionPath } from "../paths";

export const addListOperation = SpecTemplate.create(
  "add-list-operation",
  addListOperationTemplate,
);

export function addListOperationTemplate(
  spec: OpenAPIV3.Document,
  options: {
    resourceName: string;
    titleResourceName: string;
    pluralResourceName: string;
  },
): void {
  const { resourceName, titleResourceName, pluralResourceName } = options;
  const collectionPath = buildCollectionPath(pluralResourceName);
  if (!spec.paths) spec.paths = {};
  if (!spec.paths[collectionPath]) spec.paths[collectionPath] = {};
  spec.paths[collectionPath]!.get = buildListOperation(
    resourceName,
    titleResourceName,
  );
  ensureRelationSchemaComponent(spec, titleResourceName);
  ensureOrgIdComponent(spec);
}

function buildListOperation(
  resourceName: string,
  titleResourceName: string,
): OpenAPIV3.OperationObject {
  const collectionResponseSchema = buildCollectionResponseSchema(
    resourceName,
    titleResourceName,
  );
  return {
    summary: `List instances of ${resourceName}`,
    description: `List instances of ${resourceName}`,
    operationId: `list${titleResourceName}`,
    tags: [titleResourceName],
    parameters: [...commonParameters, ...paginationParameters],
    responses: {
      "200": {
        description: `Returns a list of ${resourceName} instances`,
        headers: commonHeaders,
        content: {
          "application/vnd.api+json": {
            schema: collectionResponseSchema,
          },
        },
      },
      ...commonResponses,
    },
  };
}
