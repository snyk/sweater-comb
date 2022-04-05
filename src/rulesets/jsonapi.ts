import * as fs from "fs";
import * as path from "path";
import YAML from "js-yaml";
import { SnykApiCheckDsl } from "../dsl";
import { OpenAPIV3 } from "openapi-types";
import Ajv from "ajv";
import { expect } from "chai";
import { links } from "../docs";
import { getOperationName, getResponseName } from "../names";

const ajv = new Ajv();

function isOpenApiPath(path) {
  return path.match(/\/openapi/);
}

function isItemOperation(operation) {
  return operation.pathPattern.match(/\{[a-z]*?_?id\}$/);
}

function getParameterNames(parameters) {
  return ((parameters || []) as OpenAPIV3.ParameterObject[]).map(
    (parameter) => {
      return parameter.name;
    },
  );
}

const paginationParameters = ["starting_after", "ending_before", "limit"];

const allowed4xxStatusCodes = ["400", "401", "403", "404", "409", "429"];

function loadSchemaFromFile(filename) {
  const fullFilename = path.join(__dirname, "..", "..", "schemas", filename);
  return YAML.load(fs.readFileSync(fullFilename, "utf-8"));
}

export const rules = {
  support4xxStatusCodes: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "support the correct 4xx status codes",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.standards.statusCodes);
        if (isOpenApiPath(context.path)) return;
        if (
          response.statusCode.startsWith("4") &&
          !allowed4xxStatusCodes.includes(response.statusCode)
        ) {
          expect.fail(
            `expected response to not support status code ${response.statusCode}`,
          );
        }
      },
    );
  },
  support2xxStatusCodesForDelete: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "support the correct 2xx status codes for DELETE",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.standards.statusCodes);
        if (isOpenApiPath(context.path)) return;
        if (context.method === "delete") {
          if (
            response.statusCode.startsWith("2") &&
            !["200", "204"].includes(response.statusCode)
          ) {
            expect.fail(
              `expected DELETE response to only support 200 or 204, not ${response.statusCode}`,
            );
          }
        }
      },
    );
  },
  support2xxStatusCodesForPost: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "support the correct 2xx status codes for POST",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.standards.statusCodes);
        if (isOpenApiPath(context.path)) return;

        // is batch
        if (context.method === "post" && context.requestDataPropertyIsArray) {
          if (
            response.statusCode.startsWith("2") &&
            response.statusCode !== "204"
          ) {
            expect.fail(
              `expected POST response for batches to only support 204, not ${response.statusCode}`,
            );
          }
        }

        // not batch
        if (context.method === "post" && !context.requestDataPropertyIsArray) {
          if (
            response.statusCode.startsWith("2") &&
            response.statusCode !== "201"
          ) {
            expect.fail(
              `expected POST response to only support 201, not ${response.statusCode}`,
            );
          }
        }
      },
    );
  },
  contentType: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "use the JSON:API content type",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.contentType);
        if (isOpenApiPath(context.path) || response.statusCode === "204")
          return;
        const contentTypes = Object.keys(specItem.content || {});
        if (!contentTypes.includes("application/vnd.api+json")) {
          expect.fail(
            `expected ${getResponseName(
              response,
              context,
            )} to support application/vnd.api+json`,
          );
        }
      },
    );
  },
  responseDataForPatch: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "use the correct JSON:API response data for PATCH",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        const responseName = getResponseName(response, context);
        if (context.method === "patch" && response.statusCode === "200") {
          if (
            !specItem.content["application/vnd.api+json"]?.schema?.properties
          ) {
            expect.fail(`expected ${responseName} to have a schema`);
          }
        }
      },
    );
  },
  empty204Content: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "not include content for 204 status codes",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        const responseName = getResponseName(response, context);
        if (
          ["delete", "patch"].includes(context.method) &&
          response.statusCode === "204" &&
          specItem.content
        ) {
          expect.fail(`expected ${responseName} to not have content`);
        }
      },
    );
  },
  contentFor2xxStatusCodes: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "include content for 2xx status codes other than 204",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        const responseName = getResponseName(response, context);
        if (response.statusCode !== "204" && !specItem.content) {
          expect.fail(`expected ${responseName} to have content`);
        }
      },
    );
  },
  dataProperty: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "include a JSON:API data property for 2xx status codes",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        const responseName = getResponseName(response, context);
        if (
          ["get", "post"].includes(context.method) &&
          ["200", "201"].includes(response.statusCode) &&
          !specItem.content?.["application/vnd.api+json"]?.schema?.properties
            ?.data?.type
        ) {
          expect.fail(`expected ${responseName} to have data property`);
        }
      },
    );
  },
  jsonApiProperty: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "include a JSON:API type property for 2xx status codes",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        if (context.isSingletonPath) return;
        const responseName = getResponseName(response, context);
        if (
          !["patch", "delete"].includes(context.method) &&
          ["200", "201"].includes(response.statusCode) &&
          !specItem.content?.["application/vnd.api+json"]?.schema?.properties
            ?.jsonapi?.type
        ) {
          expect.fail(
            `expected ${responseName} to have a JSON:API type property`,
          );
        }
      },
    );
  },
  locationHeader: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "include a location header",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        const responseName = getResponseName(response, context);
        if (context.method === "post" && response.statusCode === "201") {
          // Location header
          if (!specItem.headers["location"]) {
            expect.fail(`expected ${responseName} to have a location header`);
          }
          // Self link
          if (
            !specItem.content?.["application/vnd.api+json"]?.schema?.properties
              ?.links?.properties?.self
          ) {
            expect.fail(`expected ${responseName} to have a self link`);
          }
        }
      },
    );
  },
  selfLinks: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "include self links",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjectLinks);
        if (isOpenApiPath(context.path)) return;
        if (
          ((["get", "patch"].includes(context.method) &&
            response.statusCode === "200") ||
            (context.method === "post" && response.statusCode === "201")) &&
          !specItem.content?.["application/vnd.api+json"]?.schema?.properties
            ?.links?.properties?.self
        ) {
          expect.fail(
            `expected ${getResponseName(
              response,
              context,
            )} to have a self link`,
          );
        }
      },
    );
  },
  supportPaginationParameters: ({ operations }: SnykApiCheckDsl) => {
    operations.requirementOnChange.must(
      "correctly support pagination parameters",
      (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.pagination);
        if (isOpenApiPath(context.path)) return;
        if (isItemOperation(operation)) return;
        if (operation.method !== "get") return;
        const operationName = getOperationName(operation);
        const parameterNames = getParameterNames(specItem.parameters);
        const missingPaginationParameters: string[] = [];
        for (const paginationParameterName of paginationParameters) {
          if (!parameterNames.includes(paginationParameterName)) {
            missingPaginationParameters.push(paginationParameterName);
          }
        }
        if (missingPaginationParameters.length) {
          expect.fail(
            `expected ${operationName} to support pagination parameters, missing: ${missingPaginationParameters.join(
              ", ",
            )}`,
          );
        }
      },
    );
  },
  unsupportedPaginationParameters: ({ operations }: SnykApiCheckDsl) => {
    operations.requirementOnChange.must(
      "not use pagination parameters for non-GET operations",
      (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.pagination);
        if (isOpenApiPath(context.path)) return;
        if (isItemOperation(operation)) return;
        if (operation.method === "get") return;
        const operationName = getOperationName(operation);
        const parameterNames = getParameterNames(specItem.parameters);
        const unsupportedPaginationParameters: string[] = [];
        for (const paginationParameterName of paginationParameters) {
          if (parameterNames.includes(paginationParameterName)) {
            unsupportedPaginationParameters.push(paginationParameterName);
          }
        }
        if (unsupportedPaginationParameters.length) {
          expect.fail(
            `expected ${operationName} to not support pagination parameters: ${unsupportedPaginationParameters.join(
              ", ",
            )}`,
          );
        }
      },
    );
  },
  paginationLinks: ({ operations }: SnykApiCheckDsl) => {
    operations.requirementOnChange.must(
      "correctly support pagination links",
      (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.pagination);
        if (isOpenApiPath(context.path)) return;
        if (isItemOperation(operation)) return;
        if (operation.method !== "get") return;
        const operationName = getOperationName(operation);
        const response = specItem.responses["200"];
        if (!("$ref" in response)) {
          const schema =
            response.content?.["application/vnd.api+json"]?.schema || {};
          if (!("$ref" in schema) && !schema.properties?.links) {
            expect.fail(`expected ${operationName} to have pagination links`);
          }
        }
      },
    );
  },
  compoundDocuments: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "not support compound documents",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.compoundDocuments);
        if (isOpenApiPath(context.path)) return;
        if (
          ["200", "201"].includes(response.statusCode) &&
          specItem.content?.["application/vnd.api+json"]?.schema?.properties
            ?.included
        ) {
          expect.fail(
            `expected ${getResponseName(
              response,
              context,
            )} to not support compound documents`,
          );
        }
      },
    );
  },
  getPostResponseDataSchema: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "have valid JSON:API schemas for GET/POST response data",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        if (context.isSingletonPath) return;

        if (
          !(
            ["get", "post"].includes(context.method) &&
            ["200", "201"].includes(response.statusCode)
          )
        )
          return;
        const responseSchema =
          specItem.content?.["application/vnd.api+json"]?.schema?.properties
            ?.data;
        const schema: any = loadSchemaFromFile("get-post-response-data.yaml");
        const validate = ajv.compile(schema);
        const isValid = validate(responseSchema);
        if (!isValid) {
          expect.fail(
            `expected ${getResponseName(
              response,
              context,
            )} schema to be valid response data`,
          );
        }
      },
    );
  },
  patchResponseDataSchema: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "have valid JSON:API schemas for PATCH response data",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        if (context.isSingletonPath) return;
        if (!(context.method === "patch" && response.statusCode === "200"))
          return;
        const responseSchema =
          specItem.content?.["application/vnd.api+json"]?.schema?.properties;
        const schema: any = loadSchemaFromFile("patch-response-data.yaml");
        const validate = ajv.compile(schema);
        const isValid = validate(responseSchema);
        if (!isValid) {
          expect.fail(
            `expected ${getResponseName(
              response,
              context,
            )} schema to be valid response data`,
          );
        }
      },
    );
  },
  deleteResponseDataSchema: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "have valid JSON:API schemas for DELETE response data",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;
        if (!(context.method === "delete" && response.statusCode === "200"))
          return;
        const responseSchema =
          specItem.content?.["application/vnd.api+json"]?.schema;
        const schema: any = loadSchemaFromFile("delete-response-data.yaml");
        const validate = ajv.compile(schema);
        const isValid = validate(responseSchema);
        if (!isValid) {
          expect.fail(
            `expected ${getResponseName(
              response,
              context,
            )} schema to be valid response data`,
          );
        }
      },
    );
  },
  doNotAllowDeleteOrPostIdForSingleton: ({ operations }: SnykApiCheckDsl) => {
    operations.requirement.must(
      "delete and post are not allowed for singletons",
      (operation, context) => {
        if (context.isSingletonPath) {
          if (operation.method === "post" || operation.method === "delete")
            expect.fail(
              `${operation.method} is not allowed in JSON:API singletons`,
            );
        }
      },
    );
  },
};
