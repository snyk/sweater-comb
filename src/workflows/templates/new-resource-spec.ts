import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { refs } from "./common";
import { LogAddition } from "../logs";
import { jsonPointerHelpers } from "@useoptic/json-pointer-helpers";

export function buildNewResourceSpec(
  titleResourceName: string,
  name: string,
  pluralName: string,
): OpenAPIV3.Document {
  const spec: OpenAPIV3.Document = baseOpenApiSpec(
    titleResourceName,
    name,
    pluralName,
    "wip",
  );
  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};
  spec.components.schemas[`${titleResourceName}Attributes`] = {
    type: "object",
    properties: {},
    example: {},
  };

  LogAddition(
    `Added ${`${titleResourceName}Attributes`} schema`,
    jsonPointerHelpers.compile([
      "components",
      "schemas",
      `${titleResourceName}Attributes`,
    ]),
  );

  // @ts-ignore
  // Ignoring since `x-rest-common` is not correct according to the types.
  spec.components["x-rest-common"] = refs.restCommon;
  return spec;
}

function baseOpenApiSpec(
  titleResourceName: string,
  name: string,
  pluralName: string,
  stability: string,
): OpenAPIV3.Document {
  return {
    openapi: "3.0.3",
    "x-snyk-api-stability": stability,
    info: {
      title: `${titleResourceName} Resource`,
      version: "3.0.0",
      // @ts-ignore
      "x-plural-name": pluralName.toLowerCase(),
      "x-singular-name": name.toLowerCase(),
    },
    servers: [
      { url: "https://api.snyk.io/rest", description: "Snyk REST API" },
    ],
    tags: [
      {
        name: titleResourceName,
        description: `Short description of what ${titleResourceName} represents`,
      },
    ],
    paths: {},
  };
}
