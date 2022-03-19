import { commonParameters, commonResponses, refs } from "../common";
import {
  ensureIdParameterComponent,
  ensureOrgIdComponent,
} from "../parameters";
import { OpenAPIV3 } from "openapi-types";
import { SpecTemplate } from "@useoptic/openapi-cli";
import { ensureRelationSchemaComponent } from "../schemas";
import { buildItemPath } from "../paths";
import { getSingularAndPluralName, titleCase } from "../../file-resolvers";

export const addDeleteOperation = SpecTemplate.create(
  "add-delete-operation",
  addDeleteOperationTemplate,
);

export function addDeleteOperationTemplate(
  spec: OpenAPIV3.Document,
  options: {
    pluralResourceName: string;
  },
): void {
  const { pluralResourceName } = options;
  const { singular, plural } = getSingularAndPluralName(spec);
  const titleResourceName = titleCase(singular);
  const itemPath = buildItemPath(singular, plural);
  if (!spec.paths) spec.paths = {};
  if (!spec.paths[itemPath]) spec.paths[itemPath] = {};
  spec.paths[itemPath]!.delete = buildDeleteOperation(
    singular,
    titleResourceName,
  );
  ensureIdParameterComponent(spec, singular, titleResourceName);
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
