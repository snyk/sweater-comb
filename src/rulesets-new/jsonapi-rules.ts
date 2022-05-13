import {
  Ruleset,
  RuleError,
  ResponseRule,
  ResponseBodyRule,
  Matchers,
  OperationRule,
} from "@useoptic/rulesets-base";
import { links } from "../docs";
import {
  isOpenApiPath,
  isSingletonPath,
  isItemOperation,
  isBatchPostOperation,
} from "./utils";

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
  rules: [valid4xxCodes, delete2xxCodes, post2xxCodes, batchPost2xxCodes],
});

export const jsonApiContentType = new ResponseRule({
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

const responseDataForPatch = new ResponseBodyRule({
  name: "response data for patch",
  matches: (responseBody, rulesContext) =>
    rulesContext.operation.method === "patch" &&
    responseBody.statusCode === "200" &&
    responseBody.contentType === "application/vnd.api+json",
  rule: (responseAssertions) => {
    responseAssertions.body.added.matches({
      schema: {
        properties: {},
      },
    });
    responseAssertions.body.changed.matches({
      schema: {
        properties: {},
      },
    });
  },
});

const empty204Content = new ResponseRule({
  name: "empty content for 204 status codes",
  matches: (response, rulesContext) =>
    response.statusCode === "204" &&
    (rulesContext.operation.method === "delete" ||
      rulesContext.operation.method === "patch"),
  rule: (responseAssertions) => {
    responseAssertions.added(
      "not include content for 204 status codes",
      (response) => {
        if (response.bodies.length !== 0) {
          throw new RuleError({
            message: "expected response to not have content",
          });
        }
      },
    );
    responseAssertions.changed(
      "not include content for 204 status codes",
      (beforeResponse, response) => {
        if (response.bodies.length !== 0) {
          throw new RuleError({
            message: "expected response to not have content",
          });
        }
      },
    );
  },
});

const contentFor2xxStatusCodes = new ResponseRule({
  name: "context for 2xx status codes",
  matches: (response) => response.statusCode !== "204",
  rule: (responseAssertions) => {
    responseAssertions.added(
      "include content for 2xx status codes other than 204",
      (response) => {
        if (response.bodies.length === 0) {
          throw new RuleError({
            message: "expected response to have content",
          });
        }
      },
    );
    responseAssertions.changed(
      "include content for 2xx status codes other than 204",
      (beforeResponse, response) => {
        if (response.bodies.length === 0) {
          throw new RuleError({
            message: "expected response to have content",
          });
        }
      },
    );
  },
});

const dataProperty = new ResponseBodyRule({
  name: "include JSON:API data property for 2xx status codes",
  matches: (responseBody, rulesContext) =>
    ["200", "201"].includes(responseBody.statusCode) &&
    ["get", "post"].includes(rulesContext.operation.method) &&
    responseBody.contentType === "application/vnd.api+json",
  rule: (responseAssertions) => {
    responseAssertions.body.added.matches({
      schema: {
        properties: {
          data: {
            type: Matchers.string,
          },
        },
      },
    });

    responseAssertions.body.changed.matches({
      schema: {
        properties: {
          data: {
            type: Matchers.string,
          },
        },
      },
    });
  },
});

const jsonApiProperty = new ResponseBodyRule({
  name: "include JSON:API type property for 2xx status codes",
  matches: (responseBody, rulesContext) =>
    ["200", "201"].includes(responseBody.statusCode) &&
    ["patch", "delete"].includes(rulesContext.operation.method) &&
    responseBody.contentType === "application/vnd.api+json",
  rule: (responseAssertions) => {
    responseAssertions.body.added.matches({
      schema: {
        properties: {
          jsonapi: {
            type: Matchers.string,
          },
        },
      },
    });

    responseAssertions.body.changed.matches({
      schema: {
        properties: {
          jsonapi: {
            type: Matchers.string,
          },
        },
      },
    });
  },
});

const locationHeader = new ResponseRule({
  name: "location header",
  matches: (responseBody, rulesContext) =>
    rulesContext.operation.method === "get" &&
    responseBody.statusCode === "201",
  rule: (responseAssertions) => {
    responseAssertions.added.hasResponseHeaderMatching("location", {});
    responseAssertions.changed.hasResponseHeaderMatching("location", {});
  },
});

const selfLinks = new ResponseBodyRule({
  name: "self links",
  matches: (responseBody, rulesContext) => {
    const { method } = rulesContext.operation;
    const { statusCode } = responseBody;
    if (method === "get" || method === "patch") {
      return statusCode === "200";
    } else if (method === "post") {
      return statusCode === "201";
    }
    return false;
  },
  rule: (responseAssertions) => {
    responseAssertions.body.added.matches({
      schema: {
        properties: {
          links: {
            properties: {
              self: {},
            },
          },
        },
      },
    });
  },
});

const getPostResponseDataSchema = new ResponseBodyRule({
  name: "valid get / post response data schema",
  matches: (responseBody, rulesContext) => {
    const { method } = rulesContext.operation;
    const { statusCode, contentType } = responseBody;

    return (
      !isSingletonPath(rulesContext) &&
      ["get", "post"].includes(method) &&
      ["200", "201"].includes(statusCode) &&
      contentType === "application/vnd.api+json"
    );
  },
  rule: (responseAssertions) => {
    const validSchemaShapes = [
      {
        schema: {
          properties: {
            data: {
              type: "array",
              items: {
                properties: {
                  id: {
                    type: "string",
                    format: "uuid",
                  },
                  type: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      {
        schema: {
          properties: {
            data: {
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                type: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    ];

    responseAssertions.body.added.matchesOneOf(validSchemaShapes);
    responseAssertions.body.changed.matchesOneOf(validSchemaShapes);
  },
});

const patchResponseDataSchema = new ResponseBodyRule({
  name: "valid patch response data schema",
  matches: (responseBody, rulesContext) => {
    const { method } = rulesContext.operation;
    const { statusCode, contentType } = responseBody;

    return (
      !isSingletonPath(rulesContext) &&
      method === "patch" &&
      statusCode === "200" &&
      contentType === "application/vnd.api+json"
    );
  },
  rule: (responseAssertions) => {
    const validSchemaShapes = [
      {
        schema: {
          properties: {
            meta: {},
            links: {},
          },
        },
      },
      {
        schema: {
          properties: {
            data: {},
            jsonapi: {},
            links: {},
          },
        },
      },
    ];
    responseAssertions.body.added.matchesOneOf(validSchemaShapes);
    responseAssertions.body.changed.matchesOneOf(validSchemaShapes);
  },
});

const deleteResponseDataSchema = new ResponseBodyRule({
  name: "valid patch response data schema",
  matches: (responseBody, rulesContext) => {
    const { method } = rulesContext.operation;
    const { statusCode, contentType } = responseBody;

    return (
      !isSingletonPath(rulesContext) &&
      method === "delete" &&
      statusCode === "200" &&
      contentType === "application/vnd.api+json"
    );
  },
  rule: (responseAssertions) => {
    const shape = {
      schema: {
        properties: {
          meta: {},
        },
      },
    };
    responseAssertions.body.added.matches(shape);
    responseAssertions.body.changed.matches(shape);
  },
});

export const resourceObjectRules = new Ruleset({
  name: "resource objects",
  docsLink: links.jsonApi.resourceObjects,
  matches: (ruleContext) => !isOpenApiPath(ruleContext.operation.path),
  rules: [
    responseDataForPatch,
    empty204Content,
    contentFor2xxStatusCodes,
    dataProperty,
    jsonApiProperty,
    locationHeader,
    selfLinks,
    getPostResponseDataSchema,
    patchResponseDataSchema,
    deleteResponseDataSchema,
  ],
});

const paginationQueryParameters = ["starting_after", "ending_before", "limit"];

const paginationParameters = new OperationRule({
  name: "pagination parameters",
  // TODO make this a helper
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
    isItemOperation(ruleContext.operation.path),
  rules: [
    paginationParameters,
    unsupportedPaginationParameters,
    paginationLinks,
  ],
});

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
