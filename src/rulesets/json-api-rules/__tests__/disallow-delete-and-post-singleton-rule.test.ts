import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { doNotAllowDeleteOrPostIdForSingleton } from "../disallow-delete-and-post-singleton-rule";

const baseJson = TestHelpers.createEmptySpec();

describe("singleton disallowed methods", () => {
  test.each([["post"], ["delete"]])(
    "fails when adding %s method to singleton",
    (method) => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            "x-snyk-resource-singleton": true,
            [method]: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([doNotAllowDeleteOrPostIdForSingleton]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    },
  );
});
