import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "./fixtures";
import { responseHeaderRules } from "../header-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("response headers", () => {
  describe("name", () => {
    test("passes if kebab case", () => {
      const afterJson: OpenAPIV3.Document = {
        ...baseJson,
        paths: {
          "/api/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  headers: {
                    "snyk-request-id": {},
                    "snyk-version-lifecycle-stage": {},
                    "snyk-version-requested": {},
                    "snyk-version-served": {},
                    sunset: {},
                    deprecation: {},
                    "good-header": {
                      schema: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const ruleRunner = new RuleRunner([responseHeaderRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length > 0).toBe(true);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
    test("fails if not kebab case", () => {
      const afterJson: OpenAPIV3.Document = {
        ...baseJson,
        paths: {
          "/api/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  headers: {
                    "snyk-request-id": {},
                    "snyk-version-lifecycle-stage": {},
                    "snyk-version-requested": {},
                    "snyk-version-served": {},
                    sunset: {},
                    deprecation: {},
                    badHeader: {
                      schema: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const ruleRunner = new RuleRunner([responseHeaderRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length > 0).toBe(true);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });
  });

  describe("headers", () => {
    test("fails if it's missing headers", () => {
      const afterJson: OpenAPIV3.Document = {
        ...baseJson,
        paths: {
          "/api/example": {
            get: {
              responses: {
                "200": {
                  description: "No headers",
                  headers: {
                    "good-header": {
                      schema: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const ruleRunner = new RuleRunner([responseHeaderRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length > 0).toBe(true);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });
    test("passes if it has all the headers", () => {
      const afterJson: OpenAPIV3.Document = {
        ...baseJson,
        paths: {
          "/api/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  headers: {
                    "snyk-request-id": {},
                    "snyk-version-lifecycle-stage": {},
                    "snyk-version-requested": {},
                    "snyk-version-served": {},
                    sunset: {},
                    deprecation: {},
                  },
                },
              },
            },
          },
        },
      };
      const ruleRunner = new RuleRunner([responseHeaderRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length > 0).toBe(true);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });
});
