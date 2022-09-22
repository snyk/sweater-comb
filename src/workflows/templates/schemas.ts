import { OpenAPIV3 } from "openapi-types";
import { refs } from "./common";

export function buildItemResponseSchema(
  resourceName: string,
  titleResourceName: string,
): OpenAPIV3.SchemaObject {
  return {
    type: "object",
    properties: {
      jsonapi: refs.schemas.jsonApi,
      data: {
        type: "object",
        description: `${resourceName} resource object`,
        required: ["id", "type"],
        properties: {
          id: idSchema,
          type: refs.schemas.types,
          attributes: {
            $ref: `#/components/schemas/${titleResourceName}Attributes`,
          },
          relationships: {
            $ref: `#/components/schemas/${titleResourceName}Relationships`,
          },
        },
        additionalProperties: false,
      },
      links: refs.schemas.selfLink,
    },
  };
}

export function buildCollectionResponseSchema(
  resourceName: string,
  titleResourceName: string,
): OpenAPIV3.SchemaObject {
  return {
    type: "object",
    properties: {
      jsonapi: refs.schemas.jsonApi,
      data: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "type"],
          properties: {
            id: idSchema,
            type: refs.schemas.types,
            attributes: {
              $ref: `#/components/schemas/${titleResourceName}Attributes`,
            },
            relationships: {
              $ref: `#/components/schemas/${titleResourceName}Relationships`,
            },
          },
        },
      },
      links: refs.schemas.paginationLinks,
    },
  };
}

export function buildCreateRequestSchema(
  titleResourceName: string,
): OpenAPIV3.SchemaObject {
  return {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "object",
        required: ["type"],
        properties: {
          type: refs.schemas.types,
          attributes: {
            $ref: `#/components/schemas/${titleResourceName}CreateAttributes`,
          },
        },
        additionalProperties: false,
      },
    },
  };
}

export function buildUpdateRequestSchema(
  titleResourceName: string,
): OpenAPIV3.SchemaObject {
  return {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          type: refs.schemas.types,
          attributes: {
            $ref: `#/components/schemas/${titleResourceName}UpdateAttributes`,
          },
        },
        additionalProperties: false,
      },
    },
  };
}

export function ensureRelationSchemaComponent(
  spec: OpenAPIV3.Document,
  titleResourceName: string,
): void {
  const schemaName = `${titleResourceName}Relationships`;
  if (spec.components?.schemas?.[schemaName]) return;
  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};
  spec.components.schemas[schemaName] = {
    type: "object",
    properties: {},
    additionalProperties: false,
  };
}

const idSchema: OpenAPIV3.SchemaObject = {
  type: "string",
  format: "uuid",
  example: "d5b640e5-d88c-4c17-9bf0-93597b7a1ce2",
};
