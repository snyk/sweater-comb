import { RuleContext } from "@useoptic/rulesets-base";

export const isOpenApiPath = (path: string) => /\/openapi/.test(path);
export const isSingletonPath = (rulesContext: RuleContext) =>
  !!rulesContext.specification.raw.paths[rulesContext.operation.path]?.[
    "x-snyk-resource-singleton"
  ];
export const isItemOperation = (path: string) => /\{[a-z]*?_?id\}$/.test(path);
export const isBatchPostOperation = (requests) => {
  const request = requests.find(
    (request) => request.contentType === "application/vnd.api+json",
  );
  const requestSchema = request?.raw.schema;
  if (!requestSchema) {
    return false;
  }
  if (requestSchema.type !== "object") {
    return false;
  }
  return requestSchema.properties?.data?.type === "array";
};

export const isBreakingChangeAllowed = (stability: string): boolean => {
  return stability === "wip" || stability === "experimental";
};

/**
 * isCompiledOperationSunsetAllowed returns whether the operation in the rule
 * context has a sunset eligibility date compiled in, and whether the change
 * date is on or after the sunset eligibility date.
 */
export const isCompiledOperationSunsetAllowed = (
  ruleContext: RuleContext,
): boolean => {
  const {
    changeDate,
    changeVersion: { stability },
  } = ruleContext.custom;
  if (!stability) {
    return false;
  }
  if (isBreakingChangeAllowed(stability)) {
    return true;
  }
  const sunsetEligible = ruleContext.operation.raw["x-snyk-sunset-eligible"];
  if (!changeDate || !sunsetEligible) {
    return false;
  }
  if (changeDate === sunsetEligible) {
    return true;
  }
  return changeDate > sunsetEligible ? true : false;
};
