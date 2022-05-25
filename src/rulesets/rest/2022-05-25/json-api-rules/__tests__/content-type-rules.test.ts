import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { jsonApiContentTypeRule } from "../content-type-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("content type rules", () => {
  test("fails when response does not have json:api content type", () => {
    const beforeJson: OpenAPIV3.Document = {
      ...baseJson,
      paths: {
        "/api/example": {
          get: {
            responses: {},
          },
        },
      },
    };

    const afterJson: OpenAPIV3.Document = {
      ...baseJson,
      paths: {
        "/api/example": {
          get: {
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
    };

    const ruleRunner = new RuleRunner([jsonApiContentTypeRule]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(beforeJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });
});
