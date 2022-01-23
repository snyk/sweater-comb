import { SnykApiCheckDsl } from "../dsl";
import { camelCase, snakeCase } from "change-case";
import { OpenAPIV3 } from "@useoptic/api-checks";
import { expect } from "chai";
import { OpenApiRequestParameterFact } from "@useoptic/openapi-utilities";
import { links } from "../docs";

const prefixRegex = /^(get|create|list|update|delete)[A-Z]+.*/; // alternatively we could split at camelCase boundaries and assert on the first item

/**
 * Expectation to make sure a specific schema property does not change
 * @example
 * // Returns a function that's a rule for making sure
 * // the format schema property doesn't change
 * preventParameterChange("format")
 * */
const preventParameterChange = (schemaProperty: string) => {
  return (
    parameterBefore: OpenApiRequestParameterFact,
    parameterAfter: OpenApiRequestParameterFact,
  ) => {
    let beforeSchema = (parameterBefore.schema || {}) as OpenAPIV3.SchemaObject;
    let afterSchema = (parameterAfter.schema || {}) as OpenAPIV3.SchemaObject;
    if (!beforeSchema[schemaProperty] && !afterSchema[schemaProperty]) return;
    expect(
      beforeSchema[schemaProperty],
      `expected ${parameterAfter.name} parameter ${schemaProperty} to not change`,
    ).to.equal(afterSchema[schemaProperty]);
  };
};

export const rules = {
  operationId: ({ operations }: SnykApiCheckDsl) => {
    operations.requirementOnChange
      .attributes("operationId")
      .must(
        "have the correct operationId format",
        (operation, context, docs) => {
          docs.includeDocsLink(links.standards.operationIds);
          docs.becomesEffectiveOn(new Date("2021-07-01"));
          expect(operation.operationId).to.be.ok;
          if (operation.operationId !== undefined) {
            const normalized = camelCase(operation.operationId);
            expect(
              normalized === operation.operationId &&
                prefixRegex.test(operation.operationId),
              `operationId "${operation.operationId}" must be camelCase (${normalized}) and start with get|create|list|update|delete`,
            ).to.be.ok;
          }
        },
      );
  },
  operationIdSet: ({ operations }: SnykApiCheckDsl) => {
    operations.requirement.must(
      "have operationId",
      (operation, context, docs) => {
        docs.includeDocsLink(links.standards.operationIds);
        if (!operation.operationId) expect.fail("no operationId provided");
      },
    );
  },
  tags: ({ operations }: SnykApiCheckDsl) => {
    operations.requirement.must("have tags", (operation, context, docs) => {
      docs.includeDocsLink(links.standards.tags);
      expect(operation.tags).to.exist;
      if (!operation.tags) expect.fail("tags must exist");
      expect(operation.tags).to.have.lengthOf.above(0, "with at least one tag");
    });
  },
  summary: ({ operations }: SnykApiCheckDsl) => {
    operations.requirement.must(
      "have a summary",
      (operation, context, docs) => {
        docs.includeDocsLink(links.standards.operationSummary);
        if (!operation.summary) expect.fail("must have a summary");
      },
    );
  },
  removingOperationId: ({ operations }: SnykApiCheckDsl) => {
    operations.changed
      .attributes("operationId")
      .must("have consistent operation IDs", (current, next) => {
        // TODO: did not find a doc link for this
        expect(current.operationId).to.equal(next.operationId);
      });
  },
  parameterCase: ({ operations }: SnykApiCheckDsl) => {
    operations.requirementOnChange
      .attributes("name")
      .must("use the correct case", (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.standards.parameterNamesPathComponents);
        for (const p of specItem.parameters || []) {
          const parameter = p as OpenAPIV3.ParameterObject;
          if (["path", "query"].includes(parameter.in)) {
            const normalized = snakeCase(parameter.name);

            expect(
              normalized === parameter.name,
              `expected parameter name "${parameter.name}" to be snake_case (${normalized})`,
            ).to.be.ok;
          }
        }
      });
  },
  noPutHttpMethod: ({ operations }: SnykApiCheckDsl) => {
    operations.added.must("not use put method", (operation) => {
      if (operation.method === "put")
        expect.fail("put is not allowed in JSON:API");
    });
  },
  preventRemovingOperation: ({ operations }: SnykApiCheckDsl) => {
    operations.removed.must("not be allowed", (operation, context, docs) => {
      docs.includeDocsLink(links.versioning.breakingChanges);
      expect.fail("expected operation to be present");
    });
  },
  versionParameter: ({ operations }: SnykApiCheckDsl) => {
    operations.requirement.must(
      "include a version parameter",
      (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.versioning.versionParameter);
        const parameters = (specItem.parameters ||
          []) as OpenAPIV3.ParameterObject[];
        const parameterNames = parameters
          .filter((parameter) => parameter.in === "query")
          .map((parameter) => {
            return parameter.name;
          });
        expect(parameterNames).to.include("version");
      },
    );
  },
  tenantFormatting: ({ operations }: SnykApiCheckDsl) => {
    operations.requirement.must(
      "use UUID for org_id or group_id",
      (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.standards.orgAndGroupTenantResources);
        for (const parameter of specItem.parameters || []) {
          if ("$ref" in parameter) continue;
          if (parameter.name === "group_id" || parameter.name === "org_id") {
            if (!parameter.schema) {
              expect.fail(
                `expected operation ${operation.pathPattern} ${operation.method} parameter ${parameter.name} to have a schema`,
              );
              continue;
            }
            if (!("$ref" in parameter.schema)) {
              expect(
                parameter.schema.format,
                `expected operation ${operation.pathPattern} ${operation.method} parameter ${parameter.name} to use format UUID`,
              ).to.equal("uuid");
            }
          }
        }
      },
    );
  },
  pathElementsCasing: ({ specification }: SnykApiCheckDsl) => {
    specification.requirement.must(
      "use the right casing for path elements",
      (spec, context, docs) => {
        docs.includeDocsLink(links.standards.parameterNamesPathComponents);
        const pathUrls = Object.keys(spec.paths);
        for (const pathUrl of pathUrls) {
          const parts = pathUrl.replace(/[?].*/, "").split(/[/]/);
          const invalid = parts
            // Filter out empty string (leading path) and params (different rule)
            .filter((part) => part.length > 0 && !part.match(/^[{].*[}]/))
            .filter((part) => snakeCase(part) !== part);
          expect(invalid, `expected ${pathUrl} to support correct casing`).to.be
            .empty;
        }
      },
    );
  },
  preventAddingRequiredQueryParameters: ({ request }: SnykApiCheckDsl) => {
    request.queryParameter.added.must(
      "not be required",
      (queryParameter, context, docs) => {
        if (context.operationAdded) return;
        docs.includeDocsLink(links.versioning.breakingChanges);
        if (queryParameter.required) {
          expect.fail(
            `expected request query parameter ${queryParameter.name} to not be required`,
          );
        }
      },
    );
  },
  preventChangingOptionalToRequiredQueryParameters: ({
    request,
  }: SnykApiCheckDsl) => {
    request.queryParameter.changed.must(
      "not be optional then required",
      (queryParameterBefore, queryParameterAfter, context, docs) => {
        docs.includeDocsLink(links.versioning.breakingChanges);
        if (!queryParameterBefore.required && queryParameterAfter.required) {
          expect.fail(
            `expected request query parameter ${queryParameterAfter.name} to not change from optional to required`,
          );
        }
      },
    );
  },
  preventRemovingStatusCodes: ({ responses }: SnykApiCheckDsl) => {
    responses.removed.must("not be removed", (response, context, docs) => {
      docs.includeDocsLink(links.versioning.breakingChanges);
      if (!("inResponse" in context)) return;
      expect.fail(
        `expected ${context.method} ${context.path} ${context.inResponse?.statusCode} to be present`,
      );
    });
  },
  preventChangingParameterDefaultValue: ({ request }: SnykApiCheckDsl) => {
    request.queryParameter.changed.must(
      "not change the default value",
      (parameterBefore, parameterAfter, context, docs) => {
        docs.includeDocsLink(links.versioning.breakingChanges);
        let beforeSchema = (parameterBefore.schema ||
          {}) as OpenAPIV3.SchemaObject;
        let afterSchema = (parameterAfter.schema ||
          {}) as OpenAPIV3.SchemaObject;
        expect(beforeSchema.default).to.equal(afterSchema.default);
      },
    );
  },
  preventChangingParameterSchemaFormat: ({ request }: SnykApiCheckDsl) => {
    request.pathParameter.changed.must(
      "not change the path parameter format",
      preventParameterChange("format"),
    );
    request.queryParameter.changed.must(
      "not change the query parameter format",
      preventParameterChange("format"),
    );
    request.header.changed.must(
      "not change the header format",
      preventParameterChange("format"),
    );
  },
  preventChangingParameterSchemaPattern: ({ request }: SnykApiCheckDsl) => {
    request.pathParameter.changed.must(
      "not change the path parameter pattern",
      preventParameterChange("pattern"),
    );
    request.queryParameter.changed.must(
      "not change the query parameter pattern",
      preventParameterChange("pattern"),
    );
    request.header.changed.must(
      "not change the header pattern",
      preventParameterChange("pattern"),
    );
  },
  preventChangingParameterSchemaType: ({ request }: SnykApiCheckDsl) => {
    request.pathParameter.changed.must(
      "not change the path parameter pattern",
      preventParameterChange("type"),
    );
    request.queryParameter.changed.must(
      "not change the query parameter pattern",
      preventParameterChange("type"),
    );
    request.header.changed.must(
      "not change the header pattern",
      preventParameterChange("type"),
    );
  },
};
