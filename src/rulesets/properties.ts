import { SnykApiCheckDsl } from "../dsl";
import { expect } from "chai";
import { OpenAPIV3 } from "@useoptic/api-checks";
import { links } from "../docs";
import { getBodyPropertyName } from "../names";

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

/**
 * Expectation to make sure a specific schema property does not change
 * @example
 * // Returns a function that's a rule for making sure
 * // the format schema property doesn't change
 * preventChange("format")
 * */
const preventChange = (schemaProperty: string) => {
  return (parameterBefore, parameterAfter, context) => {
    let beforeSchema = (parameterBefore.flatSchema ||
      {}) as OpenAPIV3.SchemaObject;
    let afterSchema = (parameterAfter.flatSchema ||
      {}) as OpenAPIV3.SchemaObject;
    if (!beforeSchema[schemaProperty] && !afterSchema[schemaProperty]) return;
    expect(
      beforeSchema[schemaProperty],
      `expected ${getBodyPropertyName(
        context,
      )} ${schemaProperty} to not change`,
    ).to.equal(afterSchema[schemaProperty]);
  };
};

export const rules = {
  propertyKey: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.added.must("have snake case keys", ({ key }, context) => {
      // TODO: did not find a doc link for this
      const snakeCase = /^[a-z]+(?:_[a-z]+)*$/g;
      if (!snakeCase.test(key))
        expect.fail(
          `expected ${getBodyPropertyName(context)} is be snake case`,
        );
    });
  },
  preventRemoval: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.removed.must("not be removed", (property, context, docs) => {
      docs.includeDocsLink(links.versioning.breakingChanges);
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
    bodyProperties.added.must("not be required", (property, context, docs) => {
      if (context.bodyAdded) return;
      docs.includeDocsLink(links.versioning.breakingChanges);
      if (!("inRequest" in context)) return;
      if (property.required) {
        expect.fail(
          `expected ${getBodyPropertyName(context)} to not be required`,
        );
      }
    });
  },
  enumOrExample: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.added.must(
      "have enum or example",
      (property, context, docs, specItem) => {
        docs.includeDocsLink(links.standards.formats);
        if (!("inResponse" in context)) return;
        if (!withinAttributes(context)) return;
        if (specItem.type === "object" || specItem.type === "boolean") return;
        expect("enum" in specItem || "example" in specItem).to.be.true;
      },
    );
  },
  dateFormatting: ({ bodyProperties, operations }: SnykApiCheckDsl) => {
    bodyProperties.added.must(
      "use date-time for dates",
      (property, context, docs) => {
        docs.includeDocsLink(links.standards.formats);
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
        // TODO: did not find a doc link for this
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
  collectionTypeValid: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.requirementOnChange.must(
      "arrays have items",
      (item, context, docs, specItem) => {
        docs.includeDocsLink(
          "https://json-schema.org/understanding-json-schema/reference/array.html",
        );
        if (specItem.type === "array") {
          if (!specItem.items) expect.fail("array schema is missing 'items'");
          if (specItem.properties)
            expect.fail("array schema can not have 'properties'");
        }
      },
    );
    bodyProperties.requirementOnChange.must(
      "objects have properties",
      (item, context, docs, specItem) => {
        docs.includeDocsLink(
          "https://json-schema.org/understanding-json-schema/reference/object.html",
        );
        if (specItem.type === "object") {
          if (!specItem.properties)
            expect.fail("object schema is missing 'properties'");
          if (specItem.hasOwnProperty("items"))
            expect.fail("object schema can not have 'items'");
        }
      },
    );
  },
};
