import {
  RuleError,
  ResponseBodyRule,
  OperationRule,
} from "@useoptic/rulesets-base";
import {
  isOpenApiPath,
  isSingletonPath,
} from "../utils";


export const compoundDocuments = new ResponseBodyRule({
  name: "disallow compound documents",
  matches: (responseBody, rulesContext) =>
    !isOpenApiPath(rulesContext.operation.path) &&
    ["200", "201"].includes(responseBody.statusCode) &&
    responseBody.contentType === "application/vnd.api+json",
  rule: (responseAssertions) => {
    responseAssertions.body.added.not.matches({
      schema: {
        properties: {
          included: {},
        },
      },
    });

    responseAssertions.body.changed.not.matches({
      schema: {
        properties: {
          included: {},
        },
      },
    });
  },
});

export const doNotAllowDeleteOrPostIdForSingleton = new OperationRule({
  name: "disallow singletons for delete or post",
  matches: (operation, rulesContext) => isSingletonPath(rulesContext),
  rule: (operationAssertions) => {
    operationAssertions.requirement(
      "delete and post are not allowed for singletons",
      (operation) => {
        if (operation.method === "delete" || operation.method === "post") {
          throw new RuleError({
            message: `${operation.method} is not allowed in JSON:API singletons`,
          });
        }
      },
    );
  },
});
