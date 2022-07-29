import { Field, RuleContext } from "@useoptic/rulesets-base";
import { OpenAPIV3 } from "@useoptic/openapi-utilities";

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

export const isResourceMetaProperty = (property: Field): boolean => {
  const isResourceMetaProperty =
    property.location.jsonPath.match(
      new RegExp(
        ".*/schema/properties/data/(.*)properties/meta/(.*)properties/[a-z]+(?:_[a-zd]+)*/(.*)properties/.*",
      ),
    ) !== null;
  return isResourceMetaProperty;
};

export const specIsRemoved = (spec): boolean => {
  return spec.change === "removed";
};

export const isFullyTypedArray = (
  array: OpenAPIV3.ArraySchemaObject,
): boolean => {
  return isFullyTypedType(array.items as OpenAPIV3.SchemaObject);
};

export const isFullyTypedType = (type: OpenAPIV3.SchemaObject): boolean => {
  const types: OpenAPIV3.SchemaObject[] = [type];
  while (types.length > 0) {
    const type = types.pop();
    if (!type) {
      // shouldn't happen; eslint doesn't like while(true)
      break;
    }
    if (type.type) {
      // simple type: ok
      continue;
    } else if (type.oneOf) {
      if (type.oneOf.length === 0) {
        // empty composite not allowed
        return false;
      }
      types.push(...type.oneOf.map((v) => v as OpenAPIV3.SchemaObject));
    } else if (type.allOf) {
      if (type.allOf.length === 0) {
        // empty composite not allowed
        return false;
      }
      types.push(...type.allOf.map((v) => v as OpenAPIV3.SchemaObject));
    } else if (type.anyOf) {
      if (type.anyOf.length === 0) {
        // empty composite not allowed
        return false;
      }
      types.push(...type.anyOf.map((v) => v as OpenAPIV3.SchemaObject));
    } else {
      // must be a simple or composite -- this type looks empty
      return false;
    }
  }
  // must be valid as we've not found any invalid types, and we've processed at
  // least the top-level type
  return true;
};
