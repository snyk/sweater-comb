import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { paginationRules } from "../pagination-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("pagination rules", () => {
  test("fails when pagination endpoint does not specify all pagination parameters", async () => {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when non-paginated endpoint specifies any pagination parameter", async () => {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when paginated endpoints do not specify links", async () => {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("skips when path is a singular item", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          get: {
            responses: {},
          },
        },
        // Ensure multiple underscores are supported
        "/api/users/{foo_user_id}": {
          get: {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toEqual(0);
  });
});
