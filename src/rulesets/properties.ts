import { SnykApiCheckDsl } from "../dsl";
import { expect } from "chai";
import { OpenAPIV3 } from "@useoptic/api-checks";

const oas3Formats = ["date", "date-time", "password", "byte", "binary"];

const allowedFormats = Array.prototype.concat(oas3Formats, ["uuid"]);

function withinAttributes(context) {
  if (!("jsonSchemaTrail" in context)) return false;
  const { jsonSchemaTrail } = context;
  // We don't want to check [data, attributes] or [data, items, attributes]
  // so we return false for anything that isn't nested deeper.
  if (
    (jsonSchemaTrail[0] === "data" &&
      jsonSchemaTrail[1] === "attributes" &&
      jsonSchemaTrail.length > 2) ||
    (jsonSchemaTrail[0] === "data" &&
      jsonSchemaTrail[0] === "items" &&
      jsonSchemaTrail[2] === "attributes" &&
      jsonSchemaTrail.length > 3)
  )
    return true;
  return false;
}

function bodyPropertyName(context) {
  const prefix =
    "inRequest" in context
      ? "request"
      : "inResponse" in context
      ? "response"
      : "";
  return "jsonSchemaTrail" in context
    ? `${prefix} property ${context.jsonSchemaTrail.join(".")}`
    : `${prefix} property`;
}

const preventChange = (property: string) => {
  return (parameterBefore, parameterAfter, context) => {
    let beforeSchema = (parameterBefore.flatSchema ||
      {}) as OpenAPIV3.SchemaObject;
    let afterSchema = (parameterAfter.flatSchema ||
      {}) as OpenAPIV3.SchemaObject;
    if (!beforeSchema[property] && !afterSchema[property]) return;
    expect(
      beforeSchema[property],
      `expected ${bodyPropertyName(context)} ${property} to not change`,
    ).to.equal(afterSchema[property]);
  };
};

export const rules = {
  propertyKey: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.requirement.must("have snake case keys", ({ key }) => {
      const snakeCase = /^[a-z]+(?:_[a-z]+)*$/g;
      expect(snakeCase.test(key)).to.be.ok;
    });
  },
  preventRemoval: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.removed.must("not be removed", (property, context) => {
      if ("inResponse" in context && "jsonSchemaTrail" in context) {
        const propertyPath = `response body ${
          context.inResponse.statusCode
        } ${context.jsonSchemaTrail.join(".")}`;
        expect.fail(
          `expected ${context.method} ${context.path} ${propertyPath} to be present`,
        );
      }

      if (
        "inRequest" in context &&
        "body" in context.inRequest &&
        "jsonSchemaTrail" in context
      ) {
        const propertyPath = `request body ${
          context.inRequest?.body?.contentType
        } ${context.jsonSchemaTrail?.join(".")}`;
        expect.fail(
          `expected ${context.method} ${context.path} ${propertyPath} to be present`,
        );
      }
    });
  },
  preventAddingRequiredRequestProperties: ({
    bodyProperties,
  }: SnykApiCheckDsl) => {
    bodyProperties.added.must("not be required", (property, context) => {
      if (!("inRequest" in context)) return;
      expect(property.required).to.not.be.true;
    });
  },
  enumOrExample: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.requirement.must(
      "have enum or example",
      (property, context, docs, specItem) => {
        if (!("inResponse" in context)) return;
        if (!withinAttributes(context)) return;
        if (specItem.type === "object" || specItem.type === "boolean") return;
        expect("enum" in specItem || "example" in specItem).to.be.true;
      },
    );
  },
  dateFormatting: ({ bodyProperties, operations }: SnykApiCheckDsl) => {
    bodyProperties.requirement.must(
      "use date-time for dates",
      (property, context) => {
        if (!("inResponse" in context)) return;
        if (["created", "updated", "deleted"].includes(property.key)) {
          expect(property.flatSchema.format).to.equal("date-time");
        }
      },
    );
  },
  arrayWithItems: ({ bodyProperties, operations }: SnykApiCheckDsl) => {
    bodyProperties.requirement.must(
      "have type for array items",
      (property, context, docs, specItem) => {
        if (specItem.type === "array") {
          expect(specItem.items).to.have.property("type");
        }
      },
    );
  },
  preventChangingFormat: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.changed.must(
      "not change the property format",
      preventChange("format"),
    );
  },
  preventChangingPattern: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.changed.must(
      "not change the property pattern",
      preventChange("pattern"),
    );
  },
  preventChangingType: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.changed.must(
      "not change the property type",
      preventChange("type"),
    );
  },
};
