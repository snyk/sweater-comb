export const refs = {
  restCommon: asRef(
    "https://raw.githubusercontent.com/snyk/sweater-comb/common-model-v1/components/common.yaml",
  ),
  headers: {
    versionRequested: header("VersionRequestedResponseHeader"),
    versionServed: header("VersionServedResponseHeader"),
    requestId: header("RequestIdResponseHeader"),
    versionStage: header("VersionStageResponseHeader"),
    deprecation: header("DeprecationHeader"),
    sunset: header("SunsetHeader"),
    location: header("LocationHeader"),
  },
  responses: {
    "204": response("204"),
    "400": response("400"),
    "401": response("401"),
    "403": response("403"),
    "404": response("404"),
    "409": response("409"),
    "500": response("500"),
  },
  parameters: {
    version: parameter("Version"),
    startingAfter: parameter("StartingAfter"),
    endingBefore: parameter("EndingBefore"),
    limit: parameter("Limit"),
    orgId: asRef("#/components/parameters/OrgId"),
  },
  schemas: {
    paginationLinks: schema("PaginatedLinks"),
    jsonApi: schema("JsonApi"),
    types: schema("Types"),
    selfLink: schema("SelfLink"),
  },
};

export const paginationParameters = [
  refs.parameters.startingAfter,
  refs.parameters.endingBefore,
  refs.parameters.limit,
];

export const commonParameters = [
  refs.parameters.version,
  refs.parameters.orgId,
];

export const commonHeaders = {
  "snyk-version-requested": refs.headers.versionRequested,
  "snyk-version-served": refs.headers.versionServed,
  "snyk-request-id": refs.headers.requestId,
  "snyk-version-lifecycle-stage": refs.headers.versionStage,
  deprecation: refs.headers.deprecation,
  sunset: refs.headers.sunset,
};

export const { "204": _, ...commonResponses } = refs.responses;

export function asRef(ref: string) {
  return {
    $ref: ref,
  };
}

function header(name: string) {
  return {
    $ref: `#/components/x-rest-common/headers/${name}`,
  };
}

function response(name: string) {
  return {
    $ref: `#/components/x-rest-common/responses/${name}`,
  };
}

function parameter(name: string) {
  return {
    $ref: `#/components/x-rest-common/parameters/${name}`,
  };
}

function schema(name: string) {
  return {
    $ref: `#/components/x-rest-common/schemas/${name}`,
  };
}
