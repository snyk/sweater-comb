import { Ruleset, RuleError, ResponseRule } from "@useoptic/rulesets-base";
import { links } from "../../../../docs";
import {
  isOpenApiPath,
  isBatchPostOperation,
  validPost2xxCodes,
  isRelationshipPath,
} from "../utils";

const valid4xxCodes = new ResponseRule({
  name: "valid 4xx status codes",
  matches: (response) => response.statusCode.startsWith("4"),
  rule: (responseAssertions) => {
    const allowed4xxStatusCodes = ["400", "401", "403", "404","410", "409", "429"];
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
    // Batch and relationship POST requests have different rules.
    !isBatchPostOperation(rulesContext.operation.requests) &&
    !isRelationshipPath(rulesContext.operation.path) &&
    response.statusCode.startsWith("2") &&
    rulesContext.operation.method === "post",
  rule: (responseAssertions) => {
    responseAssertions.added(
      "support the correct 2xx status codes",
      (response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected POST response to only support status code(s) {${validPost2xxCodes.toString()}}, not ${
              response.statusCode
            }`,
          });
        }
      },
    );

    responseAssertions.changed(
      "support the correct 2xx status codes",
      (beforeResponse, response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected POST response to only support status code(s) {${validPost2xxCodes.toString()}}, not ${
              response.statusCode
            }`,
          });
        }
      },
    );
  },
});

const relationshipPost2xxCodes = new ResponseRule({
  name: "valid 2xx status codes for relationship post",
  matches: (response, rulesContext) =>
    isRelationshipPath(rulesContext.operation.path) &&
    // Relationship POST requests must also be batch requests.
    isBatchPostOperation(rulesContext.operation.requests) &&
    response.statusCode.startsWith("2") &&
    rulesContext.operation.method === "post",
  rule: (responseAssertions) => {
    responseAssertions.added(
      "support the correct 2xx status codes",
      (response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected relationship POST response to only support status code(s) {${validPost2xxCodes.toString()}}, not ${
              response.statusCode
            }`,
          });
        }
      },
    );

    responseAssertions.changed(
      "support the correct 2xx status codes",
      (beforeResponse, response) => {
        if (!validPost2xxCodes.includes(response.statusCode)) {
          throw new RuleError({
            message: `expected relationship POST response to only support status code(s) {${validPost2xxCodes.toString()}}, not ${
              response.statusCode
            }`,
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
    // Relationship POST requests have specific rules.
    !isRelationshipPath(rulesContext.operation.path) &&
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
    relationshipPost2xxCodes,
    get2xxCodes,
    batchPost2xxCodes,
  ],
});
