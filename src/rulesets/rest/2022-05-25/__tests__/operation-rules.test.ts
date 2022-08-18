import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "./fixtures";

import { operationRulesResource as operationRules } from "../operation-rules";
import { validDottedName } from "../operation-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("valid dot notation names", () => {
  test("leading dots are not valid", () => {
    const name = ".bad.wolf";
    expect(validDottedName(name)).toBe(false);
  });
  test("trailing dots are not valid", () => {
    const name = "bad.wolf.";
    expect(validDottedName(name)).toBe(false);
  });
  test("consecutive dots are not valid", () => {
    const name = "bad..wolf";
    expect(validDottedName(name)).toBe(false);
  });
  test("standard dot notation is valid", () => {
    const name = "bad.wolf";
    expect(validDottedName(name)).toBe(true);
  });
});

test.each(["experimental", "beta", "ga"])(
  "passes when operation is set correctly, stability %s",
  (stability) => {
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
      context: {
        ...context,
        changeVersion: {
          ...context.changeVersion,
          stability: stability,
        },
      },
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  },
);

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
        context: {
          ...context,
          changeVersion: {
            ...context.changeVersion,
            stability: "experimental",
          },
        },
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

    test("passes if removed with a spec being removed", () => {
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
          baseJson,
        ),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
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
      context: {
        ...context,
        changeVersion: {
          ...context.changeVersion,
          stability: "experimental",
        },
      },
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
    test.each(["experimental", "beta", "ga"])(
      "fails if the case is not correct, stability %s",
      (stability) => {
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
          context: {
            ...context,
            changeVersion: {
              ...context.changeVersion,
              stability: stability,
            },
          },
        };
        const results = ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(false);
        expect(results).toMatchSnapshot();
      },
    );

    test.each(["experimental", "beta", "ga"])(
      "passes if the case is correct, stability %s",
      (stability) => {
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
                    {
                      name: "prop.sub_prop",
                      in: "query",
                    },
                  ],
                  operationId: "getExample",
                  responses: {},
                },
              },
            },
          } as OpenAPIV3.Document),
          context: {
            ...context,
            changeVersion: {
              ...context.changeVersion,
              stability: stability,
            },
          },
        };
        const results = ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      },
    );
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

describe("path requirements", () => {
  test("fails if the path root is a parameter", () => {
    const ruleRunner = new RuleRunner([operationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, {
        ...baseJson,
        paths: {
          "/{anything}/{goes}": {
            get: {
              summary: "this is an example",
              tags: ["example"],
              parameters: [
                {
                  name: "version",
                  in: "query",
                },
                {
                  name: "anything",
                  in: "path",
                },
                {
                  name: "goes",
                  in: "path",
                },
              ],
              operationId: "getAnything",
              responses: {},
            },
          },
        },
      } as OpenAPIV3.Document),
      context: {
        ...context,
        changeVersion: {
          ...context.changeVersion,
          stability: "experimental",
        },
      },
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results.filter((result) => !result.passed)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error:
            "expected /{anything}/{goes} to begin with a resource name, not a parameter",
        }),
      ]),
    );
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
