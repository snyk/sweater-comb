import { RuleError, Ruleset, SpecificationRule } from "@useoptic/rulesets-base";
import { dotCase, pascalCase, snakeCase } from "change-case";
import { links } from "../../../docs";
import { stabilityKey } from "./constants";

interface componentName {
  localName: string;
  localProp?: string;
  ns?: string;
}

/**
 * Decode the component name from a possibly namespace and property-qualified OpenAPI component name.
 *
 * @param name An OpenAPI component name
 * @returns Tuple containing the local name (without namespace) and its namespace prefix (undefined if not namespaced).
 */
const decodeComponentName = (name: string): componentName => {
  const parts = name.split(".");
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    if (lastPart === snakeCase(lastPart)) {
      // Component is derived from a Typespec model property, of the form namespace.ModelName.property_name.
      // This is the case for shared parameter or header components, for example.
      return {
        localName: parts[parts.length - 2],
        localProp: lastPart,
        ns: parts.slice(0, parts.length - 2).join("."),
      };
    } else {
      // Component is derived from a Typespec model, of the form namespace.ModelName.
      // This is the case for schema components.
      return {
        localName: parts[parts.length - 1],
        ns: parts.slice(0, parts.length - 1).join("."),
      };
    }
  } else {
    return { localName: name };
  }
};

const componentNameCase = new SpecificationRule({
  name: "component names",
  docsLink: links.standards.componentNaming,
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
            const { localName, localProp, ns } =
              decodeComponentName(componentName);
            if (pascalCase(localName) !== localName) {
              throw new RuleError({
                message: `Expected ${localName} to be pascal case in component ${componentName}`,
              });
            }
            if (localProp && snakeCase(localProp) !== localProp) {
              throw new RuleError({
                message: `Expected ${localProp} to be snake case in component ${componentName}`,
              });
            }
            if (ns && dotCase(ns) !== ns) {
              throw new RuleError({
                message: `Expected ${ns} to be dot case in component ${componentName}`,
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
