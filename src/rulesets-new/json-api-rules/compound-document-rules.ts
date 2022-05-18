import { ResponseBodyRule } from "@useoptic/rulesets-base";
import { isOpenApiPath } from "../utils";

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
