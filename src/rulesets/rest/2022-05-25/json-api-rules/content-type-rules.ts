import { RuleError, ResponseRule } from "@useoptic/rulesets-base";
import { links } from "../../../../docs";
import { isOpenApiPath } from "../utils";

export const jsonApiContentTypeRule = new ResponseRule({
  name: "JSON:API content type",
  docsLink: links.jsonApi.contentType,
  matches: (response, rulesContext) =>
    !isOpenApiPath(rulesContext.operation.path) &&
    response.statusCode !== "204",
  rule: (responseAssertions) => {
    responseAssertions.added("use the JSON:API content type", (response) => {
      const responseWithJsonApiContentType = response.bodies.find(
        (body) => body.contentType === "application/vnd.api+json",
      );
      if (!responseWithJsonApiContentType) {
        throw new RuleError({
          message: `expected response to support application/vnd.api+json`,
        });
      }
    });
    responseAssertions.changed(
      "use the JSON:API content type",
      (beforeResponse, response) => {
        const responseWithJsonApiContentType = response.bodies.find(
          (body) => body.contentType === "application/vnd.api+json",
        );
        if (!responseWithJsonApiContentType) {
          throw new RuleError({
            message: `expected response to support application/vnd.api+json`,
          });
        }
      },
    );
  },
});
