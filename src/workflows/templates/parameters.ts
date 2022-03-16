import { OpenAPIV3 } from "openapi-types";

export function ensureIdParameterComponent(
  spec: OpenAPIV3.Document,
  resourceName: string,
  titleResourceName: string,
): void {
  if (spec.components?.parameters?.[`${titleResourceName}Id`]) return;
  if (!spec.components) spec.components = {};
  if (!spec.components.parameters) spec.components.parameters = {};
  spec.components.parameters[`${titleResourceName}Id`] = {
    name: `${resourceName}_id`,
    in: "path",
    required: true,
    description: `Unique identifier for ${resourceName} instances`,
    schema: {
      type: "string",
      format: "uuid",
    },
  };
}

export function ensureOrgIdComponent(spec: OpenAPIV3.Document): void {
  if (spec.components?.parameters?.[`OrgId`]) return;
  if (!spec.components) spec.components = {};
  if (!spec.components.parameters) spec.components.parameters = {};
  spec.components.parameters[`OrgId`] = {
    name: "org_id",
    in: "path",
    required: true,
    description: "Org ID",
    schema: {
      type: "string",
      format: "uuid",
    },
  };
}
