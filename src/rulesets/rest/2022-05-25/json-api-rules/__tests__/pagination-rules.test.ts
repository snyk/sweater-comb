import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { paginationRules } from "../pagination-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("pagination rules", () => {
  test("fails when pagination endpoint does not specify all pagination parameters", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users": {
          get: {
            parameters: [
              {
                name: "starting_after",
                in: "query",
              },
              {
                name: "ending_before",
                in: "query",
              },
            ],
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document;

    const ruleRunner = new RuleRunner([paginationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when non-paginated endpoint specifies any pagination parameter", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users": {
          "x-snyk-resource-singleton": true,
          get: {
            parameters: [
              {
                name: "starting_after",
                in: "query",
              },
            ],
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document;

    const ruleRunner = new RuleRunner([paginationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when paginated endpoints do not specify links", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users": {
          get: {
            parameters: [
              {
                name: "starting_after",
                in: "query",
              },
              {
                name: "ending_before",
                in: "query",
              },
              {
                name: "limit",
                in: "query",
              },
            ],
            responses: {
              "200": {
                description: "",
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      properties: {
                        nolinks: {
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
        },
      },
    } as OpenAPIV3.Document;

    const ruleRunner = new RuleRunner([paginationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });
});
