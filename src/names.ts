export function getOperationName(operation) {
  return `operation ${operation.pathPattern} ${operation.method}`;
}

export function getResponseName(response, context) {
  return `response ${context.path} ${context.method} ${response.statusCode}`;
}

export function getBodyPropertyName(context) {
  const prefix =
    "inRequest" in context
      ? "request"
      : "inResponse" in context
      ? "response"
      : "";
  return "jsonSchemaTrail" in context
    ? `${prefix} property ${context.jsonSchemaTrail.join(".")}`
    : `${prefix} property`;
}
