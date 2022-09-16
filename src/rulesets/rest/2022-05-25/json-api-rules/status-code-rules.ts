import { Ruleset, RuleError, ResponseRule } from "@useoptic/rulesets-base";
import { links } from "../../../../docs";
import { isOpenApiPath, isBatchPostOperation } from "../utils";

const valid4xxCodes = new ResponseRule({
  name: "valid 4xx status codes",
  matches: (response) => response.statusCode.startsWith("4"),
  rule: (responseAssertions) => {
    const allowed4xxStatusCodes = ["400", "401", "403", "404", "409", "429"];
    responseAssertions.added(
      "support the correct 4xx status codes",
      (response) => {
        if (!allowed4xxStatusCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected response to not support status code ${response.statusCode}`,
          });
        }
      },
    );

    responseAssertions.changed(
      "support the correct 4xx status codes",
      (beforeResponse, response) => {
        if (!allowed4xxStatusCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected response to not support status code ${response.statusCode}`,
          });
        }
      },
    );
  },
});

const delete2xxCodes = new ResponseRule({
  name: "valid 2xx status codes for delete",
  matches: (response, rulesContext) =>
    response.statusCode.startsWith("2") &&
    rulesContext.operation.method === "delete",
  rule: (responseAssertions) => {
    const validDelete2xxCodes = ["200", "204"];
    responseAssertions.added(
      "support the correct 2xx status codes",
      (response) => {
        if (!validDelete2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected response to not support status code ${response.statusCode}`,
          });
        }
      },
    );

    responseAssertions.changed(
      "support the correct 2xx status codes",
      (beforeResponse, response) => {
        if (!validDelete2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected response to not support status code ${response.statusCode}`,
          });
        }
      },
    );
  },
});

const post2xxCodes = new ResponseRule({
  name: "valid 2xx status codes for post",
  matches: (response, rulesContext) =>
    !isBatchPostOperation(rulesContext.operation.requests) &&
    response.statusCode.startsWith("2") &&
    rulesContext.operation.method === "post",
  rule: (responseAssertions) => {
    const validPost2xxCodes = ["201"];
    responseAssertions.added(
      "support the correct 2xx status codes",
      (response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected POST response to only support 201, not ${response.statusCode}`,
          });
        }
      },
    );

    responseAssertions.changed(
      "support the correct 2xx status codes",
      (beforeResponse, response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected POST response to only support 201, not ${response.statusCode}`,
          });
        }
      },
    );
  },
});

const get2xxCodes = new ResponseRule({
  name: "valid 2xx status codes for get",
  matches: (response, rulesContext) =>
    response.statusCode.startsWith("2") &&
    rulesContext.operation.method === "get",
  rule: (responseAssertions) => {
    responseAssertions.added(
      "support the correct 2xx status codes",
      (response) => {
        if (response.statusCode !== "200") {
          throw new RuleError({
            message: `expected GET response to only support 200, not ${response.statusCode}`,
          });
        }
      },
    );

    responseAssertions.changed(
      "support the correct 2xx status codes",
      (beforeResponse, response) => {
        if (response.statusCode !== "200") {
          throw new RuleError({
            message: `expected GET response to only support 200, not ${response.statusCode}`,
          });
        }
      },
    );
  },
});

const batchPost2xxCodes = new ResponseRule({
  name: "valid 2xx status codes for post",
  matches: (response, rulesContext) =>
    isBatchPostOperation(rulesContext.operation.requests) &&
    response.statusCode.startsWith("2") &&
    rulesContext.operation.method === "post",
  rule: (responseAssertions) => {
    const validPost2xxCodes = ["204"];
    responseAssertions.added(
      "support the correct 2xx status codes",
      (response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected POST response for batches to only support 204, not ${response.statusCode}`,
          });
        }
      },
    );

    responseAssertions.changed(
      "support the correct 2xx status codes",
      (beforeResponse, response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected POST response for batches to only support 204, not ${response.statusCode}`,
          });
        }
      },
    );
  },
});

export const statusCodesRules = new Ruleset({
  name: "JSON:API status codes",
  docsLink: links.standards.statusCodes,
  matches: (rulesContext) => !isOpenApiPath(rulesContext.operation.path),
  rules: [
    valid4xxCodes,
    delete2xxCodes,
    post2xxCodes,
    get2xxCodes,
    batchPost2xxCodes,
  ],
});
