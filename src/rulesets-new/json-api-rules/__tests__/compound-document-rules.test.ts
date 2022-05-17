import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { compoundDocuments } from "../compound-document-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("compoundDocuments", () => {
  test("fails when specifying compound documents", () => {
    const afterJson: OpenAPIV3.Document = {
      ...baseJson,
      paths: {
        "/api/example": {
          get: {
            responses: {
              "200": {
                description: "",
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      properties: {
                        included: {
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
    };

    const ruleRunner = new RuleRunner([compoundDocuments]);
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
