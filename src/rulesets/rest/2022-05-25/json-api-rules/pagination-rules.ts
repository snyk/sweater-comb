import {
  Ruleset,
  RuleError,
  ResponseBodyRule,
  OperationRule,
} from "@useoptic/rulesets-base";
import { links } from "../../../../docs";
import { isOpenApiPath, isSingletonPath, isItemOperation } from "../utils";

const paginationQueryParameters = ["starting_after", "ending_before", "limit"];

const paginationParameters = new OperationRule({
  name: "pagination parameters",
  matches: (operation, rulesContext) =>
    operation.method === "get" && !isSingletonPath(rulesContext),
  rule: (operationAssertions) => {
    for (const parameterName of paginationQueryParameters) {
      operationAssertions.added.hasQueryParameterMatching({
        name: parameterName,
      });

      operationAssertions.changed.hasQueryParameterMatching({
        name: parameterName,
      });
    }
  },
});

const unsupportedPaginationParameters = new OperationRule({
  name: "unsupported pagination parameters",
  matches: (operation, rulesContext) =>
    operation.method !== "get" || isSingletonPath(rulesContext),
  rule: (operationAssertions) => {
    for (const parameterName of paginationQueryParameters) {
      operationAssertions.added(
        "not use pagination parameters for non-GET operations",
        (operation) => {
          if (operation.queryParameters.has(parameterName)) {
            throw new RuleError({
              message: `expected operation to not support pagination parameter ${parameterName}`,
            });
          }
        },
      );

      operationAssertions.changed(
        "not use pagination parameters for non-GET operations",
        (beforeOperation, operation) => {
          if (operation.queryParameters.has(parameterName)) {
            throw new RuleError({
              message: `expected operation to not support pagination parameter ${parameterName}`,
            });
          }
        },
      );
    }
  },
});

const paginationLinks = new ResponseBodyRule({
  name: "pagination links",
  matches: (responseBody, rulesContext) => {
    const { method } = rulesContext.operation;

    return (
      method === "get" &&
      !isSingletonPath(rulesContext) &&
      responseBody.statusCode === "200" &&
      responseBody.contentType === "application/vnd.api+json"
    );
  },
  rule: (responseAssertions) => {
    responseAssertions.body.added.matches({
      schema: {
        properties: {
          links: {},
        },
      },
    });

    responseAssertions.body.changed.matches({
      schema: {
        properties: {
          links: {},
        },
      },
    });
  },
});

export const paginationRules = new Ruleset({
  name: "pagination",
  docsLink: links.jsonApi.pagination,
  matches: (ruleContext) =>
    !isOpenApiPath(ruleContext.operation.path) &&
    !isItemOperation(ruleContext.operation.path),
  rules: [
    paginationParameters,
    unsupportedPaginationParameters,
    paginationLinks,
  ],
});
