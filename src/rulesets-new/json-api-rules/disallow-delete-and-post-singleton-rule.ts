import { RuleError, OperationRule } from "@useoptic/rulesets-base";
import { isSingletonPath } from "../utils";

export const doNotAllowDeleteOrPostIdForSingleton = new OperationRule({
  name: "disallow singletons for delete or post",
  matches: (operation, rulesContext) => isSingletonPath(rulesContext),
  rule: (operationAssertions) => {
    operationAssertions.requirement(
      "delete and post are not allowed for singletons",
      (operation) => {
        if (operation.method === "delete" || operation.method === "post") {
          throw new RuleError({
            message: `${operation.method} is not allowed in JSON:API singletons`,
          });
        }
      },
    );
  },
});
