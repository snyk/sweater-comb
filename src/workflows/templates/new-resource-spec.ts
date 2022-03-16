import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { refs } from "./common";

export function buildNewResourceSpec(
  titleResourceName: string,
): OpenAPIV3.Document {
  const spec: OpenAPIV3.Document = baseOpenApiSpec(titleResourceName);
  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};
  spec.components.schemas[`${titleResourceName}Attributes`] = {
    type: "object",
    properties: {},
  };
  // @ts-ignore
  // Ignoring since `x-rest-common` is not correct according to the types.
  spec.components["x-rest-common"] = refs.restCommon;
  spec["x-snyk-api-stability"] = "wip";
  return spec;
}

function baseOpenApiSpec(titleResourceName: string): OpenAPIV3.Document {
  return {
    openapi: "3.0.3",
    info: {
      title: `${titleResourceName} Resource`,
      version: "3.0.0",
    },
    servers: [
      { url: "https://api.snyk.io/v3", description: "Public Snyk API" },
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
