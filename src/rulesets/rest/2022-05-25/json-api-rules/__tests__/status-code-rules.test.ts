import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { statusCodesRules } from "../status-code-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("status code rules", () => {
  test("fails when an invalid 4xx status code is specified", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          get: {
            responses: {
              "405": {
                description: "i am not valid",
                content: {
                  "application/vnd.api+json": {
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

    const ruleRunner = new RuleRunner([statusCodesRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid delete 2xx code is specified", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          delete: {
            responses: {
              "201": {
                description: "i am not valid",
                content: {
                  "application/vnd.api+json": {
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

    const ruleRunner = new RuleRunner([statusCodesRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid post 2xx code is specified", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          post: {
            responses: {
              "200": {
                description: "i am not valid",
                content: {
                  "application/vnd.api+json": {
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

    const ruleRunner = new RuleRunner([statusCodesRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid batch post 2xx code is specified", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          post: {
            requestBody: {
              content: {
                "application/vnd.api+json": {
                  schema: {
                    type: "array",
                    items: {},
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "i am not valid",
                content: {
                  "application/vnd.api+json": {
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

    const ruleRunner = new RuleRunner([statusCodesRules]);
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
