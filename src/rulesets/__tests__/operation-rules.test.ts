import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "./fixtures";

import { operationRules } from "../operation-rules";

const baseJson = TestHelpers.createEmptySpec();
test("passes when operation is set correctly", () => {
  const ruleRunner = new RuleRunner([operationRules]);
  const ruleInputs = {
    ...TestHelpers.createRuleInputs(baseJson, {
      ...baseJson,
      paths: {
        "/example": {
          get: {
            summary: "this is an example",
            tags: ["example"],
            parameters: [
              {
                name: "version",
                in: "query",
              },
            ],
            operationId: "getExample",
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document),
    context,
  };
  const results = ruleRunner.runRulesWithFacts(ruleInputs);

  expect(results.length).toBeGreaterThan(0);
  expect(results.every((result) => result.passed)).toBe(true);
  expect(results).toMatchSnapshot();
});

describe("operationId", () => {
  describe("missing", () => {
    test("fails if empty string", () => {
      const ruleRunner = new RuleRunner([operationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, {
          ...baseJson,
          paths: {
            "/example": {
              get: {
                summary: "this is an example",
                tags: ["example"],
                parameters: [
                  {
                    name: "version",
                    in: "query",
                  },
                ],
                operationId: "",
                responses: {},
              },
            },
          },
        } as OpenAPIV3.Document),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("fails if undefined", () => {
      const ruleRunner = new RuleRunner([operationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, {
          ...baseJson,
          paths: {
            "/example": {
              get: {
                summary: "this is an example",
                tags: ["example"],
                parameters: [
                  {
                    name: "version",
                    in: "query",
                  },
                ],
                responses: {},
              },
            },
          },
        } as OpenAPIV3.Document),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });
  });

  describe("when set", () => {
    test.each([
      ["fails if prefix is wrong", "findHelloWorld", false],
      ["fails if not camel case", "get-hello-world", false],
      ["fails when camel case and valid prefix but no suffix", "get", false],
      ["passes when camel case and has a hump", "getYesHump", true],
    ])("%s", (_, operationId, shouldPass) => {
      const ruleRunner = new RuleRunner([operationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, {
          ...baseJson,
          paths: {
            "/example": {
              get: {
                summary: "this is an example",
                tags: ["example"],
                parameters: [
                  {
                    name: "version",
                    in: "query",
                  },
                ],
                operationId: operationId,
                responses: {},
              },
            },
          },
        } as OpenAPIV3.Document),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(shouldPass);
      expect(results).toMatchSnapshot();
    });

    test("fails if removed", () => {
      const ruleRunner = new RuleRunner([operationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(
          {
            ...baseJson,
            paths: {
              "/example": {
                get: {
                  summary: "this is an example",
                  tags: ["example"],
                  parameters: [
                    {
                      name: "version",
                      in: "query",
                    },
                  ],
                  operationId: "getExample",
                  responses: {},
                },
              },
            },
          } as OpenAPIV3.Document,
          {
            ...baseJson,
            paths: {
              "/example": {
                get: {
                  summary: "this is an example",
                  tags: ["example"],
                  parameters: [
                    {
                      name: "version",
                      in: "query",
                    },
                  ],
                  responses: {},
                },
              },
            },
          } as OpenAPIV3.Document,
        ),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);

      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("fails if changed", () => {
      const ruleRunner = new RuleRunner([operationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(
          {
            ...baseJson,
            paths: {
              "/example": {
                get: {
                  summary: "this is an example",
                  tags: ["example"],
                  parameters: [
                    {
                      name: "version",
                      in: "query",
                    },
                  ],
                  operationId: "getExample",
                  responses: {},
                },
              },
            },
          } as OpenAPIV3.Document,
          {
            ...baseJson,
            paths: {
              "/example": {
                get: {
                  summary: "this is an example",
                  tags: ["example"],
                  parameters: [
                    {
                      name: "version",
                      in: "query",
                    },
                  ],
                  operationId: "getExampleButDifferent",
                  responses: {},
                },
              },
            },
          } as OpenAPIV3.Document,
        ),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);

      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });
  });
});

describe("operation metadata", () => {
  test("fails if summary is missing", () => {
    const ruleRunner = new RuleRunner([operationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, {
        ...baseJson,
        paths: {
          "/example": {
            get: {
              tags: ["example"],
              parameters: [
                {
                  name: "version",
                  in: "query",
                },
              ],
              operationId: "getExample",
              responses: {},
            },
          },
        },
      } as OpenAPIV3.Document),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);

    expect(results.length).toBeGreaterThan(0);

    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails if tags is not supplied", () => {
    const ruleRunner = new RuleRunner([operationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, {
        ...baseJson,
        paths: {
          "/example": {
            get: {
              summary: "this is an example",
              tags: [],
              parameters: [
                {
                  name: "version",
                  in: "query",
                },
              ],
              operationId: "getExample",
              responses: {},
            },
          },
        },
      } as OpenAPIV3.Document),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);

    expect(results.length).toBeGreaterThan(0);

    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });
});

describe("operation parameters", () => {
  describe("names", () => {
    test("fails if the case is not correct", () => {
      const ruleRunner = new RuleRunner([operationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, {
          ...baseJson,
          paths: {
            "/example/{pathParameter}": {
              get: {
                summary: "this is an example",
                tags: ["example"],
                parameters: [
                  {
                    name: "version",
                    in: "query",
                  },
                  {
                    name: "pathParameter",
                    in: "path",
                  },
                ],
                operationId: "getExample",
                responses: {},
              },
            },
          },
        } as OpenAPIV3.Document),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("passes if the case is correct", () => {
      const ruleRunner = new RuleRunner([operationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, {
          ...baseJson,
          paths: {
            "/example/{path_parameter}": {
              get: {
                summary: "this is an example",
                tags: ["example"],
                parameters: [
                  {
                    name: "version",
                    in: "query",
                  },
                  {
                    name: "path_parameter",
                    in: "path",
                  },
                ],
                operationId: "getExample",
                responses: {},
              },
            },
          },
        } as OpenAPIV3.Document),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });
  test("fails when adding a required query parameter", () => {
    const ruleRunner = new RuleRunner([operationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(
        {
          ...baseJson,
          paths: {
            "/example": {
              get: {
                summary: "this is an example",
                tags: ["example"],
                parameters: [
                  {
                    name: "version",
                    in: "query",
                  },
                ],
                operationId: "getExample",
                responses: {},
              },
            },
          },
        } as OpenAPIV3.Document,
        {
          ...baseJson,
          paths: {
            "/example": {
              get: {
                summary: "this is an example",
                tags: ["example"],
                parameters: [
                  {
                    name: "version",
                    in: "query",
                  },
                  {
                    name: "required",
                    in: "query",
                    required: true,
                  },
                ],
                operationId: "getExample",
                responses: {},
              },
            },
          },
        } as OpenAPIV3.Document,
      ),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("allows adding a required query parameter to a new operation", () => {
    const ruleRunner = new RuleRunner([operationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, {
        ...baseJson,
        paths: {
          "/example": {
            get: {
              summary: "this is an example",
              tags: ["example"],
              parameters: [
                {
                  name: "version",
                  in: "query",
                },
                {
                  name: "required",
                  in: "query",
                  required: true,
                },
              ],
              operationId: "getExample",
              responses: {},
            },
          },
        },
      } as OpenAPIV3.Document),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  test.each([
    [
      "passes when changing optional to required query parameter in experimental",
      "experimental",
      true,
    ],
    ["fails when changing optional to required query parameter", "ga", false],
  ])("%s", (_, stability, shouldPass) => {
    const beforeJson = {
      ...baseJson,
      paths: {
        "/example": {
          get: {
            summary: "this is an example",
            tags: ["example"],
            parameters: [
              {
                name: "version",
                in: "query",
              },
              {
                name: "required",
                in: "query",
              },
            ],
            operationId: "getExample",
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document;

    const afterJson = {
      ...baseJson,
      paths: {
        "/example": {
          get: {
            summary: "this is an example",
            tags: ["example"],
            parameters: [
              {
                name: "version",
                in: "query",
              },
              {
                name: "required",
                in: "query",
                required: true,
              },
            ],
            operationId: "getExample",
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([operationRules]);

    const ruleInputs = {
      ...TestHelpers.createRuleInputs(beforeJson, afterJson),
      context: {
        ...context,
        changeVersion: { ...context.changeVersion, stability },
      },
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(shouldPass);
    expect(results).toMatchSnapshot();
  });

  test.each([
    [
      "passes if the default value is changed in experimental",
      "experimental",
      true,
    ],
    ["fails if the default value is changed", "ga", false],
  ])("%s", (_, stability, shouldPass) => {
    const beforeJson = {
      ...baseJson,
      paths: {
        "/example": {
          get: {
            summary: "this is an example",
            tags: ["example"],
            parameters: [
              {
                name: "version",
                in: "query",
              },
              {
                name: "query_parameter",
                in: "query",
                schema: {
                  type: "string",
                  default: "before",
                },
              },
            ],
            operationId: "getExample",
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document;

    const afterJson = {
      ...baseJson,
      paths: {
        "/example": {
          get: {
            summary: "this is an example",
            tags: ["example"],
            parameters: [
              {
                name: "version",
                in: "query",
              },
              {
                name: "query_parameter",
                in: "query",
                schema: {
                  type: "string",
                  default: "after",
                },
              },
            ],
            operationId: "getExample",
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([operationRules]);

    const ruleInputs = {
      ...TestHelpers.createRuleInputs(beforeJson, afterJson),
      context: {
        ...context,
        changeVersion: { ...context.changeVersion, stability },
      },
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(shouldPass);
    expect(results).toMatchSnapshot();
  });
});

describe("status codes", () => {
  test("fails when status code is removed", () => {
    const beforeJson = {
      ...baseJson,
      paths: {
        "/example": {
          get: {
            summary: "this is an example",
            tags: ["example"],
            parameters: [
              {
                name: "version",
                in: "query",
              },
            ],
            operationId: "getExample",
            responses: {
              "200": {
                description: "123",
              },
            },
          },
        },
      },
    } as OpenAPIV3.Document;

    const afterJson = {
      ...baseJson,
      paths: {
        "/example": {
          get: {
            summary: "this is an example",
            tags: ["example"],
            parameters: [
              {
                name: "version",
                in: "query",
              },
            ],
            operationId: "getExample",
            responses: {},
          },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([operationRules]);
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

describe("version parameter", () => {
  test("fails when there is no version parameter", () => {
    const ruleRunner = new RuleRunner([operationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, {
        ...baseJson,
        paths: {
          "/example": {
            get: {
              summary: "this is an example",
              tags: ["example"],
              operationId: "getExample",
              responses: {},
            },
          },
        },
      } as OpenAPIV3.Document),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });
});

describe("put method", () => {
  test("fails adding put method", () => {
    const ruleRunner = new RuleRunner([operationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, {
        ...baseJson,
        paths: {
          "/example": {
            put: {
              summary: "this is an example",
              tags: ["example"],
              parameters: [
                {
                  name: "version",
                  in: "query",
                },
              ],
              operationId: "getExample",
              responses: {},
            },
          },
        },
      } as OpenAPIV3.Document),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });
});
