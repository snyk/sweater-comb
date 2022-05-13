import { RuleContext } from "@useoptic/rulesets-base";

export const isOpenApiPath = (path: string) => !/\/openapi/.test(path);
export const isSingletonPath = (rulesContext: RuleContext) =>
  !!rulesContext.specification.raw.paths[rulesContext.operation.path]?.[
    "x-snyk-resource-singleton"
  ];
export const isItemOperation = (path: string) => /\{[a-z]*?_?id\}$/.test(path);
export const isBatchPostOperation = (requests) => {
  const request = requests.find(
    (request) => request.contentType === "application/vnd.api+json",
  );

  return request ? request.value.flatSchema.type === "array" : false;
};
