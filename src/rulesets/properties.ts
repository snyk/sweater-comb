import { SnykApiCheckDsl } from "../dsl";
const { expect } = require("chai");

const oas3Formats = ["date", "date-time", "password", "byte", "binary"];

const allowedFormats = Array.prototype.concat(oas3Formats, [
  "uuid",
  "semver",
  "url",
  "parameter",
  "path",
  "user-text",
  "resource-type",
]);

export const rules = {
  propertyKey: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.requirement.must("have camel case keys", ({ key }) => {
      const snakeCase = /^[a-z]+(?:_[a-z]+)*$/g;
      expect(snakeCase.test(key)).to.be.ok;
    });
  },
  propertyExample: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.requirement.must("have an example", ({ flatSchema }) => {
      if (flatSchema?.type !== "object" && flatSchema?.type !== "array") {
        expect(flatSchema.example).to.exist;
      }
    });
  },
  propertyFormat: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.requirement.should(
      "have a format when a string",
      ({ flatSchema }) => {
        if (flatSchema.type === "string") {
          if (flatSchema.format) {
            expect(flatSchema.format).to.be.oneOf(allowedFormats);
          } else {
            expect(flatSchema.pattern).to.exist;
          }
        }
      },
    );
  },
  preventRemoval: ({ bodyProperties }: SnykApiCheckDsl) => {
    bodyProperties.removed.must("not be removed", (property, context) => {
      const propertyPath = context.inResponse
        ? `response body ${context.inResponse.statusCode} ${
            context.inResponse.body?.contentType
          } ${context.jsonSchemaTrail?.join(".")}`
        : `request body ${
            context.inRequest?.body?.contentType
          } ${context.jsonSchemaTrail?.join(".")}`;
      expect.fail(
        `expected ${context.method} ${context.path} ${propertyPath} to be present`,
      );
    });
  },
  preventAddingRequiredRequestProperties: ({
    bodyProperties,
  }: SnykApiCheckDsl) => {
    bodyProperties.added.must("not be required", (property, context) => {
      if (!context.inRequest) return;
      expect(property.required).to.not.be.true;
    });
  },
};
