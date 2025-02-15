import {
  Ruleset,
  RuleError,
  ResponseRule,
  ResponseBodyRule,
  RequestRule,
  Matchers,
  Matcher,
} from "@useoptic/rulesets-base";
import { links } from "../../../../docs";
import {
  isOpenApiPath,
  isSingletonPath,
  validPost2xxCodes,
  isRelationshipPath,
} from "../utils";

const resourceIDFormat = new Matcher((value: any): boolean => {
  return value === "uuid" || value === "uri" || value === "ulid";
});

const matchPatchRequest = {
  data: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: resourceIDFormat,
      },
      type: {
        type: Matchers.string,
      },
      attributes: {
        type: "object",
      },
    },
  },
};

const matchBulkPatchRequest = {
  data: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: {
          type: "string",
          format: resourceIDFormat,
        },
        type: {
          type: Matchers.string,
        },
        attributes: {
          type: "object",
        },
      },
    },
  },
};

const requestDataForPatch = new RequestRule({
  name: "request body for patch",
  docsLink: links.jsonApi.patchRequests,
  matches: (request, rulesContext) =>
    // Relationship PATCH requests have different rules.
    !isRelationshipPath(rulesContext.operation.path) &&
    rulesContext.operation.method === "patch" &&
    request.contentType === "application/vnd.api+json",
  rule: (requestAssertions) => {
    const validSchemas = [
      {
        schema: {
          type: "object",
          properties: matchPatchRequest,
        },
      },
      {
        schema: {
          type: "object",
          properties: matchBulkPatchRequest,
        },
      },
    ];
    requestAssertions.body.added.matchesOneOf(validSchemas);
    requestAssertions.body.changed.matchesOneOf(validSchemas);
  },
});

const matchPostRequest = {
  data: {
    type: "object",
    properties: {
      type: {
        type: Matchers.string,
      },
    },
  },
};

const requestDataForPost = new RequestRule({
  name: "request body for post",
  docsLink: links.jsonApi.postRequests,
  matches: (request, rulesContext) =>
    !isRelationshipPath(rulesContext.operation.path) &&
    request.contentType === "application/vnd.api+json" &&
    rulesContext.operation.method === "post" &&
    !rulesContext.operation.responses.has("204"),
  rule: (requestAssertions) => {
    requestAssertions.body.added.matches({
      schema: {
        type: "object",
        properties: matchPostRequest,
      },
    });
    requestAssertions.body.changed.matches({
      schema: {
        type: "object",
        properties: matchPostRequest,
      },
    });
  },
});

// Relationship POST, PATCH, and DELETE requests can have
// a request body with resource objects for the relationships
// to be added/patched/deleted.
const matchRelationshipModificationRequestArrayData = {
  data: {
    type: "array",
    items: {
      type: "object",
      properties: {
        type: {
          type: Matchers.string,
        },
        id: {
          type: "string",
          format: resourceIDFormat,
        },
      },
    },
  },
};

// Relationship POST, PATCH, and DELETE requests can have
// a request body with a resource object for the single relationship
// to be added (set)/patched/deleted.
const matchRelationshipModificationRequestSingleData = {
  data: {
    type: "object",
    properties: {
      type: {
        type: Matchers.string,
      },
      id: {
        type: "string",
        format: resourceIDFormat,
      },
    },
  },
};

const requestDataForRelationshipModification = new RequestRule({
  name: "request body for relationship post/patch/delete",
  docsLink: links.jsonApi.postRequests,
  matches: (request, rulesContext) =>
    isRelationshipPath(rulesContext.operation.path) &&
    request.contentType === "application/vnd.api+json" &&
    ["patch", "delete", "post"].includes(rulesContext.operation.method),
  rule: (requestAssertions) => {
    requestAssertions.body.added.matchesOneOf([
      {
        schema: {
          type: "object",
          properties: matchRelationshipModificationRequestArrayData,
        },
      },
      {
        schema: {
          type: "object",
          properties: matchRelationshipModificationRequestSingleData,
        },
      },
    ]);
    requestAssertions.body.changed.matchesOneOf([
      {
        schema: {
          type: "object",
          properties: matchRelationshipModificationRequestArrayData,
        },
      },
      {
        schema: {
          type: "object",
          properties: matchRelationshipModificationRequestSingleData,
        },
      },
    ]);
  },
});

const matchBulkPostRequest = {
  data: {
    type: "array",
    items: {
      type: "object",
      properties: {
        type: {
          type: Matchers.string,
        },
      },
    },
  },
};

const requestDataForBulkPost = new RequestRule({
  name: "request body for bulk post",
  docsLink: links.jsonApi.patchRequests,
  matches: (request, rulesContext) =>
    !isRelationshipPath(rulesContext.operation.path) &&
    rulesContext.operation.method === "post" &&
    rulesContext.operation.responses.has("204") &&
    request.contentType === "application/vnd.api+json",
  rule: (requestAssertions) => {
    requestAssertions.body.added.matches({
      schema: {
        type: "object",
        properties: matchBulkPostRequest,
      },
    });
    requestAssertions.body.changed.matches({
      schema: {
        type: "object",
        properties: matchBulkPostRequest,
      },
    });
  },
});

const responseDataForPatch = new ResponseBodyRule({
  name: "response data for patch",
  docsLink: links.jsonApi.patchResponses,
  matches: (responseBody, rulesContext) =>
    rulesContext.operation.method === "patch" &&
    responseBody.statusCode === "200" &&
    responseBody.contentType === "application/vnd.api+json",
  rule: (responseAssertions) => {
    responseAssertions.body.added.matches({
      schema: {
        type: "object",
        properties: {},
      },
    });
    responseAssertions.body.changed.matches({
      schema: {
        type: "object",
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
  name: "body is required for status!=[202,204,303]",
  matches: (response) => !["202", "204", "303"].includes(response.statusCode),
  rule: (responseAssertions) => {
    responseAssertions.added(
      "include content for 2xx status codes other than 202, 204, 303",
      (response) => {
        if (response.bodies.length === 0) {
          throw new RuleError({
            message: "expected response to have content",
          });
        }
      },
    );
    responseAssertions.changed(
      "include content for 2xx status codes other than 202, 204, 303",
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
    validPost2xxCodes.includes(responseBody.statusCode) &&
    // 204 is allowed as a POST response but does not need a location header.
    // See https://jsonapi.org/format/#crud-creating-responses-204
    responseBody.statusCode !== "204" &&
    responseBody.statusCode !== "202",
  rule: (responseAssertions) => {
    responseAssertions.added.hasResponseHeaderMatching("location", {});
    responseAssertions.changed.hasResponseHeaderMatching("location", {});
  },
});

const contentLocationHeaderFor202 = new ResponseRule({
  name: "content-location header for 202",
  matches: (responseBody, rulesContext) =>
    ["post", "patch", "delete"].indexOf(rulesContext.operation.method) >= 0 &&
    // 202 is allowed as a POST, PATCH, DELETE response and needs a Content-Location header.
    // See https://jsonapi.org/recommendations/#asynchronous-processing
    responseBody.statusCode == "202",
  rule: (responseAssertions) => {
    responseAssertions.added.hasResponseHeaderMatching("content-location", {});
    responseAssertions.changed.hasResponseHeaderMatching(
      "content-location",
      {},
    );
  },
});

const locationHeaderFor303 = new ResponseRule({
  name: "location header for 303",
  matches: (responseBody) =>
    // 303 needs a Location header.
    // See https://jsonapi.org/recommendations/#asynchronous-processing
    responseBody.statusCode == "303",
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
                    format: resourceIDFormat,
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
                  format: resourceIDFormat,
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

const getSingletonResponseDataSchema = new ResponseBodyRule({
  name: "valid get singleton response data schema",
  matches: (responseBody, rulesContext) => {
    const { method } = rulesContext.operation;
    const { statusCode, contentType } = responseBody;

    return (
      isSingletonPath(rulesContext) &&
      method === "get" &&
      statusCode === "200" &&
      contentType === "application/vnd.api+json"
    );
  },
  rule: (responseAssertions) => {
    const validSchemaShape = {
      schema: {
        properties: {
          data: {
            properties: {
              type: {
                type: "string",
              },
            },
          },
        },
      },
    };

    responseAssertions.body.added.matches(validSchemaShape);
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
            data: {
              properties: {
                id: {
                  type: "string",
                  format: resourceIDFormat,
                },
                type: {
                  type: "string",
                },
              },
            },
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

const patchSingletonResponseDataSchema = new ResponseBodyRule({
  name: "valid patch singleton response data schema",
  matches: (responseBody, rulesContext) => {
    const { method } = rulesContext.operation;
    const { statusCode, contentType } = responseBody;

    return (
      isSingletonPath(rulesContext) &&
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
            data: {
              properties: {
                type: {
                  type: "string",
                },
              },
            },
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
  name: "valid delete response data schema",
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
    requestDataForPatch,
    requestDataForPost,
    requestDataForRelationshipModification,
    requestDataForBulkPost,
    responseDataForPatch,
    empty204Content,
    contentFor2xxStatusCodes,
    dataProperty,
    jsonApiProperty,
    locationHeader,
    contentLocationHeaderFor202,
    locationHeaderFor303,
    selfLinks,
    getPostResponseDataSchema,
    getSingletonResponseDataSchema,
    patchResponseDataSchema,
    patchSingletonResponseDataSchema,
    deleteResponseDataSchema,
  ],
});
