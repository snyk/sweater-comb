import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import {
  RuleError,
  Ruleset,
  OperationRule,
  Matcher,
  Matchers,
  ResponseRule,
} from "@useoptic/rulesets-base";
import { camelCase, snakeCase } from "change-case";
import { links } from "../../../docs";
import {
  isBreakingChangeAllowed,
  isCompiledOperationSunsetAllowed,
} from "./utils";

export const validDottedName = (name) => {
  return (
    !name.startsWith(".") &&
    !name.endsWith(".") &&
    name.split(".").every((n) => {
      return n !== "" && snakeCase(n) === n;
    })
  );
};

const operationId = new OperationRule({
  name: "operation id",
  docsLink: links.standards.operationIds,
  matches: (operation, ruleContext) => {
    if (operation.path.startsWith("/openapi")) {
      return false;
    }
    const changeDate = new Date(ruleContext.custom.changeVersion.date);
    const effectiveOnDate = new Date("2021-07-01");
    return changeDate > effectiveOnDate;
  },
  rule: (operationAssertions) => {
    const prefixRegex = /^(get|create|list|update|delete)[A-Z]+.*/; // alternatively we could split at camelCase boundaries and assert on the first item

    const operationIdMatcher = new Matcher(
      (value) =>
        typeof value === "string" &&
        value === camelCase(value) &&
        prefixRegex.test(value),
      "camel case and starts with get|create|list|update|delete matcher",
    );
    operationAssertions.added.matches(
      {
        operationId: operationIdMatcher,
      },
      {
        errorMessage:
          "operationId must be camelCase and start with get|create|list|update|delete",
      },
    );
    operationAssertions.changed.matches(
      {
        operationId: operationIdMatcher,
      },
      {
        errorMessage:
          "operationId must be camelCase and start with get|create|list|update|delete",
      },
    );
  },
});

const operationIdSet = new OperationRule({
  name: "operation id set",
  docsLink: links.standards.operationIds,
  rule: (operationAssertions) => {
    operationAssertions.requirement.matches(
      {
        operationId: Matchers.string,
      },
      {
        errorMessage: "operationId must be set and a string",
      },
    );
  },
});

const tags = new OperationRule({
  name: "operation tags",
  docsLink: links.standards.tags,
  rule: (operationAssertions) => {
    operationAssertions.requirement.matches(
      {
        tags: [Matchers.string], // expects at least 1 tag of string
      },
      {
        errorMessage: "tags must exist and have at least one tag",
      },
    );
  },
});

const summary = new OperationRule({
  name: "operation summary",
  docsLink: links.standards.operationSummary,
  matches: (operation) => !operation.path.startsWith("/openapi"),
  rule: (operationAssertions) => {
    operationAssertions.requirement.matches(
      {
        summary: Matchers.string,
      },
      {
        errorMessage: "must have a summary",
      },
    );
  },
});

const consistentOperationIds = new OperationRule({
  name: "consistent operation ids",
  docsLink: links.standards.operationSummary,
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (operationAssertions) => {
    operationAssertions.changed(
      "have consistent operation IDs",
      (before, after) => {
        if (before.value.operationId !== after.value.operationId) {
          throw new RuleError({
            message: "operationIds was changed",
          });
        }
      },
    );
  },
});

const parameterCase = new OperationRule({
  name: "operation parameters snake case",
  docsLink: links.standards.parameterNamesPathComponents,
  rule: (operationAssertions) => {
    operationAssertions.pathParameter.added(
      "use the correct case",
      (pathParameter) => {
        const name = pathParameter.value.name;
        if (snakeCase(name) !== name) {
          throw new RuleError({
            message: `expected parameter name ${name} to be snake case`,
          });
        }
      },
    );

    operationAssertions.queryParameter.added(
      "use the correct case",
      (queryParameter) => {
        const name = queryParameter.value.name;
        if (!validDottedName(name)) {
          throw new RuleError({
            message: `expected parameter name ${name} to be snake case`,
          });
        }
      },
    );
  },
});

const noPutHttpMethod = new OperationRule({
  name: "no put method",
  rule: (operationAssertions) => [
    operationAssertions.added("not use put method", (operation) => {
      if (operation.method === "put") {
        throw new RuleError({
          message: "put is not allowed in JSON:API",
        });
      }
    }),
  ],
});

const preventOperationRemovalRule = {
  name: "prevent operation removal",
  docsLink: links.versioning.breakingChanges,
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (operationAssertions) => {
    operationAssertions.removed("not be allowed", () => {
      throw new RuleError({
        message: "expected operation to be present",
      });
    });
  },
};

const preventOperationRemovalResource = new OperationRule(
  preventOperationRemovalRule,
);

const preventOperationRemovalCompiled = new OperationRule({
  ...preventOperationRemovalRule,
  matches: (operation, ruleContext) =>
    preventOperationRemovalRule.matches(operation, ruleContext) &&
    !isCompiledOperationSunsetAllowed(ruleContext),
});

const requireVersionParameter = new OperationRule({
  name: "require version parameter",
  docsLink: links.versioning.versionParameter,
  matches: (operation) => !operation.path.startsWith("/openapi"),
  rule: (operationAssertions) => {
    operationAssertions.requirement.hasQueryParameterMatching({
      name: "version",
    });
  },
});

const tenantFormatting = new OperationRule({
  name: "tenant formatting",
  docsLink: links.standards.orgAndGroupTenantResources,
  rule: (operationAssertions) => {
    operationAssertions.pathParameter.requirement(
      "use UUID for org_id or group_id",
      (parameter) => {
        const name = parameter.value.name;
        if (name === "group_id" || name === "org_id") {
          if (!parameter.value.schema) {
            throw new RuleError({
              message: "expected parameter to have a schema",
            });
          }

          if (
            !("$ref" in parameter.value.schema) &&
            parameter.value.schema.format !== "uuid"
          ) {
            throw new RuleError({
              message: "expected parameter to use format uuid",
            });
          }
        }
      },
    );
  },
});

const pathElementCasing = new OperationRule({
  name: "path element casing",
  docsLink: links.standards.parameterNamesPathComponents,
  rule: (operationAssertions) => {
    operationAssertions.requirement(
      "use the right casing for path elements",
      (operation) => {
        const parts = operation.path.replace(/[?].*/, "").split(/[/]/);
        const invalid = parts
          // Filter out empty string (leading path) and params (different rule)
          .filter((part) => part.length > 0 && !part.match(/^[{].*[}]/))
          .filter((part) => snakeCase(part) !== part);
        if (invalid.length !== 0) {
          throw new RuleError({
            message: `expected ${operation.path} to support the correct casing`,
          });
        }
      },
    );
  },
});

const resourceRootParamter = new OperationRule({
  name: "resource path cannot begin with a parameter",
  rule: (operationAssertions) => {
    operationAssertions.requirement(
      "declare a resource name at the path root",
      (operation) => {
        if (operation.path.match(/^\/\{/)) {
          throw new RuleError({
            message: `expected ${operation.path} to begin with a resource name, not a parameter`,
          });
        }
      },
    );
  },
});

const preventAddingRequiredQueryParameters = new OperationRule({
  name: "prevent adding required query parameter",
  docsLink: links.versioning.breakingChanges,
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability) &&
    ruleContext.operation.change !== "added",
  rule: (operationAssertions) => {
    operationAssertions.queryParameter.added("not be required", (parameter) => {
      if (parameter.value.required) {
        throw new RuleError({
          message: `expected request query parameter ${parameter.value.name} to not be required`,
        });
      }
    });
  },
});

const preventChangingOptionalToRequiredQueryParameters = new OperationRule({
  name: "prevent changing optional query parameter to required",
  docsLink: links.versioning.breakingChanges,
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (operationAssertions) => {
    operationAssertions.queryParameter.changed(
      "not be required",
      (before, after) => {
        if (!before.value.required && after.value.required) {
          throw new RuleError({
            message: `expected request query parameter ${after.value.required} to not change from optional to required`,
          });
        }
      },
    );
  },
});

const preventRemovingStatusCodesRule = {
  name: "prevent removing status codes",
  docsLink: links.versioning.breakingChanges,
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (responseAssertions) => {
    responseAssertions.removed("not be removed", () => {
      throw new RuleError({
        message: "must not remove response status code",
      });
    });
  },
};

const preventRemovingStatusCodesResource = new ResponseRule(
  preventRemovingStatusCodesRule,
);

const preventRemovingStatusCodesCompiled = new ResponseRule({
  ...preventRemovingStatusCodesRule,
  matches: (operation, ruleContext) =>
    preventRemovingStatusCodesRule.matches(operation, ruleContext) &&
    !isCompiledOperationSunsetAllowed(ruleContext),
});

const preventChangingParameterDefaultValue = new OperationRule({
  name: "prevent changing parameter default value",
  docsLink: links.versioning.breakingChanges,
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (operationAssertions) => {
    operationAssertions.queryParameter.changed(
      "not change the default value",
      (before, after) => {
        const beforeSchema = (before.value.schema ||
          {}) as OpenAPIV3.SchemaObject;
        const afterSchema = (after.value.schema ||
          {}) as OpenAPIV3.SchemaObject;

        if (beforeSchema.default !== afterSchema.default) {
          throw new RuleError({
            message: `default schema was changed from ${beforeSchema.default} to ${afterSchema.default}`,
          });
        }
      },
    );
  },
});

const preventChangingParameterSchemaFormat = new OperationRule({
  name: "prevent changing parameter schema format",
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (operationAssertions) => {
    const parameterAssertion = (before, after) => {
      const beforeSchema = (before.value.schema ||
        {}) as OpenAPIV3.SchemaObject;
      const afterSchema = (after.value.schema || {}) as OpenAPIV3.SchemaObject;

      if (beforeSchema.format !== afterSchema.format) {
        throw new RuleError({
          message: `schema format was changed from ${beforeSchema.format} to ${afterSchema.format}`,
        });
      }
    };

    operationAssertions.queryParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
    operationAssertions.headerParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
    operationAssertions.pathParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
  },
});

const preventChangingParameterSchemaPattern = new OperationRule({
  name: "prevent changing parameter schema pattern",
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (operationAssertions) => {
    const parameterAssertion = (before, after) => {
      const beforeSchema = (before.value.schema ||
        {}) as OpenAPIV3.SchemaObject;
      const afterSchema = (after.value.schema || {}) as OpenAPIV3.SchemaObject;

      if (beforeSchema.pattern !== afterSchema.pattern) {
        throw new RuleError({
          message: `schema pattern was changed from ${beforeSchema.pattern} to ${afterSchema.pattern}`,
        });
      }
    };

    operationAssertions.queryParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
    operationAssertions.headerParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
    operationAssertions.pathParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
  },
});

const preventChangingParameterSchemaType = new OperationRule({
  name: "prevent changing parameter schema type",
  matches: (operation, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (operationAssertions) => {
    const parameterAssertion = (before, after) => {
      const beforeSchema = (before.value.schema ||
        {}) as OpenAPIV3.SchemaObject;
      const afterSchema = (after.value.schema || {}) as OpenAPIV3.SchemaObject;

      if (beforeSchema.type !== afterSchema.type) {
        throw new RuleError({
          message: `schema type was changed from ${beforeSchema.type} to ${afterSchema.type}`,
        });
      }
    };

    operationAssertions.queryParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
    operationAssertions.headerParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
    operationAssertions.pathParameter.changed(
      "not change the schema format",
      parameterAssertion,
    );
  },
});

export const operationRulesResource = new Ruleset({
  name: "operation rules",
  rules: [
    operationId,
    operationIdSet,
    tags,
    summary,
    consistentOperationIds,
    parameterCase,
    noPutHttpMethod,
    preventOperationRemovalResource,
    requireVersionParameter,
    tenantFormatting,
    pathElementCasing,
    preventAddingRequiredQueryParameters,
    preventChangingOptionalToRequiredQueryParameters,
    preventRemovingStatusCodesResource,
    preventChangingParameterDefaultValue,
    preventChangingParameterSchemaFormat,
    preventChangingParameterSchemaPattern,
    preventChangingParameterSchemaType,
    resourceRootParamter,
  ],
});

export const operationRulesCompiled = new Ruleset({
  name: "operation rules",
  rules: [
    operationId,
    operationIdSet,
    tags,
    summary,
    consistentOperationIds,
    parameterCase,
    noPutHttpMethod,
    preventOperationRemovalCompiled,
    requireVersionParameter,
    tenantFormatting,
    pathElementCasing,
    preventAddingRequiredQueryParameters,
    preventChangingOptionalToRequiredQueryParameters,
    preventRemovingStatusCodesCompiled,
    preventChangingParameterDefaultValue,
    preventChangingParameterSchemaFormat,
    preventChangingParameterSchemaPattern,
    preventChangingParameterSchemaType,
    resourceRootParamter,
  ],
});
