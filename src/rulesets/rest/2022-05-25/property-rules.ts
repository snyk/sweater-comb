import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import {
  RequestRule,
  ResponseBodyRule,
  RuleError,
  Ruleset,
} from "@useoptic/rulesets-base";
import { links } from "../../../docs";
import {
  isBreakingChangeAllowed,
  isCompiledOperationSunsetAllowed,
  isResourceMetaProperty,
  isFullyTypedArray,
  specIsRemoved,
} from "./utils";

const snakeCase = /^[a-z]+(?:_[a-z\d]+)*$/;

const requestPropertyCasing = new RequestRule({
  name: "request property casing",
  rule: (requestAssertions) => {
    requestAssertions.property.added("have snake case keys", (property) => {
      if (isResourceMetaProperty(property)) {
        return;
      }
      if (!snakeCase.test(property.value.key)) {
        throw new RuleError({
          message: `expected ${property.value.key} to be snake case`,
        });
      }
    });
  },
});

const responsePropertyCasing = new ResponseBodyRule({
  name: "response property casing",
  rule: (responseAssertions) => {
    responseAssertions.property.added("have snake case keys", (property) => {
      if (isResourceMetaProperty(property)) {
        return;
      }
      if (!snakeCase.test(property.value.key)) {
        throw new RuleError({
          message: `expected ${property.value.key} to be snake case`,
        });
      }
    });
  },
});

const requestPropertyRemovalRule = {
  name: "request property removal",
  docsLink: links.versioning.breakingChanges,
  matches: (specification, ruleContext) =>
    ruleContext.operation.change !== "added" &&
    !specIsRemoved(specification) &&
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (requestAssertions) => {
    requestAssertions.property.removed("not be removed", (property) => {
      throw new RuleError({
        message: `Expected property ${property.value.key} to not be removed`,
      });
    });
  },
};

const requestPropertyRemovalResource = new RequestRule(
  requestPropertyRemovalRule,
);

const requestPropertyRemovalCompiled = new RequestRule({
  ...requestPropertyRemovalRule,
  matches: (specification, ruleContext) =>
    requestPropertyRemovalRule.matches(specification, ruleContext) &&
    !isCompiledOperationSunsetAllowed(ruleContext),
});

const responsePropertyRemovalRule = {
  name: "response property removal",
  docsLink: links.versioning.breakingChanges,
  matches: (specification, ruleContext) =>
    ruleContext.operation.change !== "added" &&
    !specIsRemoved(specification) &&
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (responseAssertions) => {
    responseAssertions.property.removed("not be removed", (property) => {
      throw new RuleError({
        message: `Expected property ${property.value.key} to not be removed`,
      });
    });
  },
};

const responsePropertyRemovalResource = new ResponseBodyRule(
  responsePropertyRemovalRule,
);

const responsePropertyRemovalCompiled = new ResponseBodyRule({
  ...responsePropertyRemovalRule,
  matches: (specification, ruleContext) =>
    responsePropertyRemovalRule.matches(specification, ruleContext) &&
    !isCompiledOperationSunsetAllowed(ruleContext),
});

const requiredRequestProperties = new RequestRule({
  name: "prevent adding a required request property",
  docsLink: links.versioning.breakingChanges,
  matches: (_, ruleContext) =>
    ruleContext.operation.change !== "added" &&
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (requestAssertions) => {
    requestAssertions.property.added(
      "not add required request property",
      (property) => {
        if (property.value.required) {
          throw new RuleError({
            message:
              "cannot add a required request property to an existing operation",
          });
        }
      },
    );

    requestAssertions.property.changed(
      "not make an optional request property required",
      (before, after) => {
        if (!before.value.required && after.value.required) {
          throw new RuleError({
            message: "cannot make a request property required",
          });
        }
      },
    );
  },
});

function withinAttributes(context) {
  if (!("jsonSchemaTrail" in context)) return false;
  const { jsonSchemaTrail } = context;
  // We don't want to check [data, attributes] or [data, items, attributes]
  // so we return false for anything that isn't nested deeper.
  if (
    (jsonSchemaTrail[0] === "data" &&
      jsonSchemaTrail[1] === "attributes" &&
      jsonSchemaTrail.length > 2) ||
    (jsonSchemaTrail[0] === "data" &&
      jsonSchemaTrail[0] === "items" &&
      jsonSchemaTrail[2] === "attributes" &&
      jsonSchemaTrail.length > 3)
  )
    return true;
  return false;
}

const enumOrExample = new RequestRule({
  name: "request property enum or example",
  docsLink: links.standards.formats,
  rule: (requestAssertions) => {
    requestAssertions.property.added("have enum or example", (property) => {
      const type = property.value.flatSchema.type;
      if (!withinAttributes(property.location)) return;
      if (type === "object" || type === "boolean") return;
      if (!("enum" in property.raw || "example" in property.raw)) {
        throw new RuleError({
          message: "expect property to have an enum or example",
        });
      }
    });
  },
});

const requestDateFormatting = new RequestRule({
  name: "request property date formatting",
  docsLink: links.standards.timestampProperties,
  rule: (requestAssertions) => {
    requestAssertions.property.added("use date-time for dates", (property) => {
      if (property.value.key.endsWith("_at")) {
        if (property.value.flatSchema.format !== "date-time") {
          throw new RuleError({
            message:
              "expected property name ending in '_at' to have format date-time",
          });
        }
      }
    });
  },
});

const responseDateFormatting = new ResponseBodyRule({
  name: "response property date formatting",
  docsLink: links.standards.formats,
  rule: (responseAssertions) => {
    responseAssertions.property.added("use date-time for dates", (property) => {
      if (property.value.key.endsWith("_at")) {
        if (property.value.flatSchema.format !== "date-time") {
          throw new RuleError({
            message: "expected property to have format date-time",
          });
        }
      }
    });
  },
});

const arrayWithItemsInRequest = new RequestRule({
  name: "request array with items",
  rule: (requestAssertions) => {
    requestAssertions.property.requirement(
      "have type for array items",
      (property) => {
        if (property.raw.type === "array") {
          if (!isFullyTypedArray(property.raw)) {
            throw new RuleError({
              message: "type was not found array items",
            });
          }
        }
      },
    );
  },
});

const arrayWithItemsInResponse = new ResponseBodyRule({
  name: "response array with items",
  rule: (responseAssertions) => {
    responseAssertions.property.requirement(
      "have type for array items",
      (property) => {
        if (property.raw.type === "array") {
          if (!isFullyTypedArray(property.raw)) {
            throw new RuleError({
              message: "type was not found array items",
            });
          }
        }
      },
    );
  },
});

const requiredPropertiesDeclaredInRequestBody = new RequestRule({
  name: "request schema properties",
  rule: (requestAssertions) => {
    requestAssertions.body.requirement(
      "declare required properties in objects",
      (body) => {
        checkRequiredProperties((body.raw as any).schema);
      },
    );
  },
});

const requiredPropertiesDeclaredInResponse = new ResponseBodyRule({
  name: "response schema properties",
  rule: (responseAssertions) => {
    responseAssertions.body.requirement(
      "declare required properties in objects",
      (body) => {
        checkRequiredProperties(body.raw.schema as OpenAPIV3.SchemaObject);
      },
    );
  },
});

const checkRequiredProperties = (schema: OpenAPIV3.SchemaObject) => {
  const schemas = [schema];
  const path: string[] = [];
  while (schemas.length > 0) {
    const schema = schemas.pop();
    for (const required of schema?.required ?? []) {
      if (schema?.properties && !schema.properties[required]) {
        throw new RuleError({
          message: `missing required property ${[...path, required].join(".")}`,
        });
      }
    }
    if (schema?.properties) {
      for (const propName in schema?.properties) {
        const prop = schema.properties[propName] as OpenAPIV3.SchemaObject;
        if (prop.type === "object") {
          path.push(propName);
          schemas.push(prop);
        }
      }
    }
  }
};

const preventChangingRequestFormat = new RequestRule({
  name: "prevent changing format in request property",
  matches: (_, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (requestAssertions) => {
    requestAssertions.property.changed(
      "not change the property format",
      (before, after) => {
        const beforeSchema = (before.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        const afterSchema = (after.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        if (!beforeSchema.format && !afterSchema.format) return;
        if (beforeSchema.format !== afterSchema.format) {
          throw new RuleError({
            message: "expected format to not change",
          });
        }
      },
    );
  },
});

const preventChangingResponseFormat = new ResponseBodyRule({
  name: "prevent changing format in request property",
  matches: (_, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (responseAssertions) => {
    responseAssertions.property.changed(
      "not change the property format",
      (before, after) => {
        const beforeSchema = (before.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        const afterSchema = (after.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        if (!beforeSchema.format && !afterSchema.format) return;
        if (beforeSchema.format !== afterSchema.format) {
          throw new RuleError({
            message: "expected format to not change",
          });
        }
      },
    );
  },
});

const preventChangingRequestPattern = new RequestRule({
  name: "prevent changing pattern in request property",
  matches: (_, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (requestAssertions) => {
    requestAssertions.property.changed(
      "not change the property pattern",
      (before, after) => {
        const beforeSchema = (before.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        const afterSchema = (after.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        if (!beforeSchema.pattern && !afterSchema.pattern) return;
        if (beforeSchema.pattern !== afterSchema.pattern) {
          throw new RuleError({
            message: "expected pattern to not change",
          });
        }
      },
    );
  },
});

const preventChangingResponsePattern = new ResponseBodyRule({
  name: "prevent changing pattern in request property",
  matches: (_, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (responseAssertions) => {
    responseAssertions.property.changed(
      "not change the property pattern",
      (before, after) => {
        const beforeSchema = (before.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        const afterSchema = (after.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        if (!beforeSchema.pattern && !afterSchema.pattern) return;
        if (beforeSchema.pattern !== afterSchema.pattern) {
          throw new RuleError({
            message: "expected pattern to not change",
          });
        }
      },
    );
  },
});

const preventChangingRequestType = new RequestRule({
  name: "prevent changing type in request property",
  matches: (_, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (requestAssertions) => {
    requestAssertions.property.changed(
      "not change the property type",
      (before, after) => {
        const beforeSchema = (before.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        const afterSchema = (after.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        if (!beforeSchema.type && !afterSchema.type) return;
        if (beforeSchema.type !== afterSchema.type) {
          throw new RuleError({
            message: "expected type to not change",
          });
        }
      },
    );
  },
});

const preventChangingResponseType = new ResponseBodyRule({
  name: "prevent changing type in request property",
  matches: (_, ruleContext) =>
    !isBreakingChangeAllowed(ruleContext.custom.changeVersion.stability),
  rule: (responseAssertions) => {
    responseAssertions.property.changed(
      "not change the property type",
      (before, after) => {
        const beforeSchema = (before.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        const afterSchema = (after.value.flatSchema ||
          {}) as OpenAPIV3.SchemaObject;
        if (!beforeSchema.type && !afterSchema.type) return;
        if (beforeSchema.type !== afterSchema.type) {
          throw new RuleError({
            message: "expected type to not change",
          });
        }
      },
    );
  },
});

const propertyAssertion = (property) => {
  if (property.raw.type === "array") {
    if (!property.raw.items) {
      throw new RuleError({
        message: "array schema is missing 'items'",
      });
    }
    if (property.raw.properties) {
      throw new RuleError({
        message: "array schema can not have 'properties'",
      });
    }
  }
};
const collectionTypeValidRequest = new RequestRule({
  name: "valid collection type in request property",
  rule: (requestAssertions) => {
    requestAssertions.property.added(
      "not change the property type",
      propertyAssertion,
    );
    requestAssertions.property.changed(
      "not change the property type",
      propertyAssertion,
    );
  },
});

const collectionTypeValidResponse = new ResponseBodyRule({
  name: "valid collection type in response property",
  rule: (responseAssertions) => {
    responseAssertions.property.added(
      "not change the property type",
      propertyAssertion,
    );
    responseAssertions.property.changed(
      "not change the property type",
      propertyAssertion,
    );
  },
});

export const propertyRulesResource = new Ruleset({
  name: "property rules for resource OpenAPI",
  rules: [
    requestPropertyCasing,
    responsePropertyCasing,
    requestPropertyRemovalResource,
    responsePropertyRemovalResource,
    requiredRequestProperties,
    enumOrExample,
    requestDateFormatting,
    responseDateFormatting,
    arrayWithItemsInRequest,
    arrayWithItemsInResponse,
    preventChangingRequestFormat,
    preventChangingResponseFormat,
    preventChangingRequestPattern,
    preventChangingResponsePattern,
    preventChangingRequestType,
    preventChangingResponseType,
    collectionTypeValidRequest,
    collectionTypeValidResponse,
    requiredPropertiesDeclaredInRequestBody,
    requiredPropertiesDeclaredInResponse,
  ],
});

export const propertyRulesCompiled = new Ruleset({
  name: "property rules for resource OpenAPI",
  rules: [
    requestPropertyCasing,
    responsePropertyCasing,
    requestPropertyRemovalCompiled,
    responsePropertyRemovalCompiled,
    requiredRequestProperties,
    enumOrExample,
    requestDateFormatting,
    responseDateFormatting,
    arrayWithItemsInRequest,
    arrayWithItemsInResponse,
    preventChangingRequestFormat,
    preventChangingResponseFormat,
    preventChangingRequestPattern,
    preventChangingResponsePattern,
    preventChangingRequestType,
    preventChangingResponseType,
    collectionTypeValidRequest,
    collectionTypeValidResponse,
    requiredPropertiesDeclaredInRequestBody,
    requiredPropertiesDeclaredInResponse,
  ],
});
