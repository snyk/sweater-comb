import {
  Ruleset,
  RuleError,
  ResponseRule,
  ResponseBodyRule,
  Matchers,
} from "@useoptic/rulesets-base";
import { links } from "../../docs";
import { isOpenApiPath, isSingletonPath } from "../utils";

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
  name: "content for 2xx status codes",
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
    rulesContext.operation.method === "post" &&
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
