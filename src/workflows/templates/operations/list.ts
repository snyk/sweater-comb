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
} from "../common";
import { SpecTemplate } from "@useoptic/openapi-cli";
import { ensureOrgIdComponent } from "../parameters";
import { buildCollectionPath } from "../paths";
import { getSingularAndPluralName, titleCase } from "../../file-resolvers";
import { AlreadyInSpec, LogAddition } from "../../logs";
import { jsonPointerHelpers } from "@useoptic/json-pointer-helpers";

export const addListOperation = SpecTemplate.create(
  "add-list-operation",
  addListOperationTemplate,
);

export function addListOperationTemplate(
  spec: OpenAPIV3.Document,
  options: {
    pluralResourceName: string;
  },
): void {
  const { pluralResourceName } = options;
  const { singular } = getSingularAndPluralName(spec);
  const titleResourceName = titleCase(singular);
  const collectionPath = buildCollectionPath(pluralResourceName);
  if (!spec.paths) spec.paths = {};
  if (!spec.paths[collectionPath]) spec.paths[collectionPath] = {};

  const alreadySet = Boolean(spec.paths[collectionPath]?.get);
  if (alreadySet) return AlreadyInSpec("get", collectionPath);

  spec.paths[collectionPath]!.get = buildListOperation(
    singular,
    titleResourceName,
  );

  LogAddition(
    "Added List Resource Operation",
    jsonPointerHelpers.compile(["paths", collectionPath, "get"]),
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
