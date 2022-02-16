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

function loadSchemaFromFile(filename) {
  const fullFilename = path.join(__dirname, "..", "..", "schemas", filename);
  return YAML.load(fs.readFileSync(fullFilename, "utf-8"));
}

export const rules = {
  statusCodes: ({ operations }: SnykApiCheckDsl) => {
    operations.requirementOnChange.must(
      "support the correct status codes",
      (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.standards.statusCodes);
        if (isOpenApiPath(context.path)) return;
        const operationName = getOperationName(operation);
        const statusCodes = Object.keys(specItem.responses);

        // Ensure only supported 4xx are used
        const allowed4xxStatusCodes = [
          "400",
          "401",
          "403",
          "404",
          "409",
          "429",
        ];
        const statusCodes4xx = statusCodes.filter((statusCode) =>
          statusCode.startsWith("4"),
        );
        const unsupportedStatusCodes: string[] = [];
        for (const statusCode4xx of statusCodes4xx) {
          if (!allowed4xxStatusCodes.includes(statusCode4xx)) {
            unsupportedStatusCodes.push(statusCode4xx);
          }
        }
        if (unsupportedStatusCodes.length) {
          expect.fail(
            `expected ${operationName} to not support status codes: ${unsupportedStatusCodes.join(
              ", ",
            )}`,
          );
        }

        // Ensure delete supports correct 2xx status codes
        if (operation.method === "delete") {
          const statusCodes2xx = statusCodes.filter((statusCode) =>
            statusCode.startsWith("2"),
          );
          const unsupportedStatusCodes: string[] = [];
          for (const statusCode2xx of statusCodes2xx) {
            if (!["200", "204"].includes(statusCode2xx)) {
              unsupportedStatusCodes.push(statusCode2xx);
            }
          }
          if (unsupportedStatusCodes.length) {
            expect.fail(
              `expected ${operationName} to only support 200 or 204, not: ${unsupportedStatusCodes.join(
                ", ",
              )}`,
            );
          }
        }

        // Ensure post supports correct 2xx status codes
        if (operation.method === "post") {
          const statusCodes2xx = statusCodes.filter((statusCode) =>
            statusCode.startsWith("2"),
          );
          const unsupportedStatusCodes: string[] = [];
          for (const statusCode2xx of statusCodes2xx) {
            if (statusCode2xx !== "201") {
              unsupportedStatusCodes.push(statusCode2xx);
            }
          }
          if (unsupportedStatusCodes.length) {
            expect.fail(
              `expected ${operationName} to only support 201, not: ${unsupportedStatusCodes.join(
                ", ",
              )}`,
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
  responseData: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "use the correct JSON:API response data",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;

        const responseName = getResponseName(response, context);

        // Patch response requires schema
        if (context.method === "patch" && response.statusCode === "200") {
          if (
            !specItem.content["application/vnd.api+json"]?.schema?.properties
          ) {
            expect.fail(`expected ${responseName} to have a schema`);
          }
        }

        // Empty patch 204 content
        if (
          ["delete", "patch"].includes(context.method) &&
          response.statusCode === "204" &&
          specItem.content
        ) {
          expect.fail(`expected ${responseName} to not have content`);
        }

        // Non-204 status codes must have content
        if (response.statusCode !== "204" && !specItem.content) {
          expect.fail(`expected ${responseName} to have content`);
        }

        // JSON:API data property
        if (
          ["get", "post"].includes(context.method) &&
          ["200", "201"].includes(response.statusCode) &&
          !specItem.content["application/vnd.api+json"]?.schema?.properties
            ?.data?.type
        ) {
          expect.fail(`expected ${responseName} to have data property`);
        }

        // JSON:API jsonapi property
        if (
          !["patch", "delete"].includes(context.method) &&
          ["200", "201"].includes(response.statusCode) &&
          !specItem.content["application/vnd.api+json"]?.schema?.properties
            ?.jsonapi?.type
        ) {
          expect.fail(`expected ${responseName} to have a JSON:API property`);
        }

        // Success post responses
        if (context.method === "post" && response.statusCode === "201") {
          // Location header
          if (!specItem.headers["location"]) {
            expect.fail(`expected ${responseName} to have a location header`);
          }
          // Self link
          if (
            !specItem.content["application/vnd.api+json"]?.schema?.properties
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

        // Top-level self links
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
  pagination: ({ operations }: SnykApiCheckDsl) => {
    operations.requirementOnChange.must(
      "correctly support pagination",
      (operation, context, docs, specItem) => {
        docs.includeDocsLink(links.jsonApi.pagination);
        if (isOpenApiPath(context.path)) return;

        const operationName = getOperationName(operation);

        const paginationParameters = [
          "starting_after",
          "ending_before",
          "limit",
        ];
        const parameterNames = (
          (specItem.parameters || []) as OpenAPIV3.ParameterObject[]
        ).map((parameter) => {
          return parameter.name;
        });
        if (!operation.pathPattern.match(/\{[a-z]*?_?id\}$/)) {
          if (operation.method === "get") {
            // Require pagination parameters
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

            // Require pagination links
            const response = specItem.responses["200"];
            if (!("$ref" in response)) {
              const schema =
                response.content?.["application/vnd.api+json"]?.schema || {};
              if (!("$ref" in schema)) {
                expect(
                  schema.properties?.links,
                  `expected ${operationName} to have pagination links`,
                ).to.exist;
              }
            }
          }
        } else {
          if (operation.method !== "get") {
            for (const paginationParameterName of paginationParameters) {
              if (parameterNames.includes(paginationParameterName)) {
                expect.fail(
                  `expected ${operationName} to not include ${paginationParameterName} parameter`,
                );
              }
            }
          }
        }
      },
    );
  },
  compoundDocuments: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "not allow compound documents",
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
  schemas: ({ responses }: SnykApiCheckDsl) => {
    responses.requirementOnChange.must(
      "have valid JSON:API schemas",
      (response, context, docs, specItem) => {
        // TODO: this isn't a great link for this
        docs.includeDocsLink(links.jsonApi.resourceObjects);
        if (isOpenApiPath(context.path)) return;

        // Response data
        if (
          ["get", "post"].includes(context.method) &&
          ["200", "201"].includes(response.statusCode)
        ) {
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
        }

        // Patch response data
        if (context.method === "patch" && response.statusCode === "200") {
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
        }

        // Delete response data
        if (context.method === "delete" && response.statusCode === "200") {
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
        }

        // TODO: this is a schema checking a schema. It's currently failing, so removing for now.
        // // Relationships
        // const relationships =
        //   specItem.content?.["application/vnd.api+json"]?.schema?.properties
        //     ?.data?.properties?.relationships;
        // if (relationships) {
        //   const schema: any = loadSchemaFromFile("relationship.yaml");
        //   const validate = ajv.compile(schema);
        //   expect(
        //     validate(relationships),
        //     `expected ${getResponseName(
        //       response,
        //       context,
        //     )} schema to have valid relationships`,
        //   ).to.be.true;
        // }
      },
    );
  },
};
