import { RuleError, Ruleset, SpecificationRule } from "@useoptic/rulesets-base";
import { pascalCase } from "change-case";
import { links } from "../../../docs";
import { stabilityKey } from "./constants";

const componentNameCase = new SpecificationRule({
  name: "component names",
  docsLink: links.standards.referencedEntities,
  rule: (specificationAssertions) => {
    specificationAssertions.requirement(
      "use pascal case for component names",
      (specification) => {
        const componentTypes = Object.keys(specification.raw.components || {});
        for (const componentType of componentTypes) {
          if (componentType.startsWith("x-")) {
            continue;
          }
          if (componentType === "securitySchemes") {
            continue;
          }
          const componentNames = Object.keys(
            specification.raw.components?.[componentType] || {},
          );
          for (const componentName of componentNames) {
            if (pascalCase(componentName) !== componentName) {
              throw new RuleError({
                message: `Expected ${componentName} to be pascal case`,
              });
            }
          }
        }
      },
    );
  },
});

const listOpenApiVersions = new SpecificationRule({
  name: "list open api version",
  // Only applicable to compiled OAS; resource versions do not need to declare this
  matches: (specification) => specification.value[stabilityKey] === undefined,
  docsLink: links.standards.openApiVersions,
  rule: (specificationAssertions) => {
    specificationAssertions.requirement(
      "list the available versioned OpenAPI specifications",
      (specification) => {
        const pathUrls = Object.keys(specification.raw.paths);
        if (!pathUrls.includes("/openapi")) {
          throw new RuleError({
            message: "Expected route /openapi to be included",
          });
        }
      },
    );
  },
});

const getOpenApiVersions = new SpecificationRule({
  name: "get open api versions",
  // Only applicable to compiled OAS; resource versions do not need to declare this
  matches: (specification) => specification.value[stabilityKey] === undefined,
  docsLink: links.standards.openApiVersions,
  rule: (specificationAssertions) => {
    specificationAssertions.requirement(
      "provide versioned OpenAPI specifications",
      (specification) => {
        const pathUrls = Object.keys(specification.raw.paths);
        if (!pathUrls.includes("/openapi/{version}")) {
          throw new RuleError({
            message: "Expected route /openapi/{version} to be included",
          });
        }
      },
    );
  },
});

const tags = new SpecificationRule({
  name: "open api version names",
  docsLink: links.standards.tags,
  rule: (specificationAssertions) => {
    specificationAssertions.requirement(
      "have name and description for tags",
      (specification) => {
        const tags = specification.value.tags || [];
        for (const tag of tags) {
          if (!("name" in tag)) {
            throw new RuleError({
              message: "name is not in tag",
            });
          }
          if (!("description" in tag)) {
            throw new RuleError({
              message: "description is not in tag",
            });
          }
        }
      },
    );
  },
});

const noDiscriminatorMapping = new SpecificationRule({
  name: "no mapping objects in discriminators",
  docsLink: links.standards.polymorphicObjects,
  rule: (specificationAssertions) => {
    specificationAssertions.addedOrChanged(
      "no mapping objects in discriminators",
      (specification) => {
        // propertyName is the only required field on a discriminator object,
        // plus we only care about the objects with mappings
        const discriminators = findObjectsWithFields([
          "propertyName",
          "mapping",
        ])(specification.raw);

        if (discriminators.length != 0) {
          throw new RuleError({
            message: "Mapping object is not permitted in discriminators",
          });
        }
      },
    );
  },
});

const findObjectsWithFields = (fields: string[]) => (from: unknown) => {
  if (typeof from !== "object" || from == null) {
    return [];
  }
  return Object.values(from).flatMap((v) => {
    if (typeof v !== "object" || v == null) {
      return [];
    }
    if (Array.isArray(v)) {
      return v.flatMap(findObjectsWithFields(fields));
    }
    if (fields.every((field) => field in v)) {
      return [v];
    }
    return findObjectsWithFields(fields)(v);
  });
};

export const specificationRules = new Ruleset({
  name: "specification rules",
  rules: [
    componentNameCase,
    tags,
    getOpenApiVersions,
    listOpenApiVersions,
    noDiscriminatorMapping,
  ],
});
