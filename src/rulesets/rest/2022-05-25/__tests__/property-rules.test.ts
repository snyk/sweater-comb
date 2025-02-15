import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "./fixtures";
import { propertyRulesResource as propertyRules } from "../property-rules";
import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { string } from "yargs";

const baseOpenAPI = {
  ...TestHelpers.createEmptySpec(),
  paths: {
    "/example": {
      get: {
        responses: {},
      },
    },
  },
};

describe("body properties", () => {
  describe("key", () => {
    test("passes when snake case with more than one component", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          is_snake_case: { type: "string" },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test("passes when snake case with a number as an n+1 component", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          is_allowed_after_30_days: { type: "string" },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test("fails when number in n=1 snake case component", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          "30_days": { type: "string" },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("passes when snake case with one component", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          technicallysnakecase: { type: "string" },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test("fails when not snake case", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          "not-snake-case": { type: "string" },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("fails when not snake case in experimental", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          "not-snake-case": { type: "string" },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context: {
          ...context,
          changeVersion: {
            date: "2021-10-10",
            stability: "experimental",
          },
        },
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("fails when not snake case in nested field", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          snake_case: {
                            type: "object",
                            properties: {
                              notSNAKEcase: { type: "string" },
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("allows non-snake case if already in spec", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          snake_case: {
                            type: "object",
                            properties: {
                              notSNAKEcase: { type: "string" },
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    const jsonapiMeta = {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            type: {
              type: "string",
            },
            attributes: {
              type: "object",
              properties: {
                something: {
                  type: "string",
                },
              },
            },
            meta: {},
          },
        },
      },
    };

    test("passes when meta values do not use snake case", async () => {
      const bodySchema = {
        ...jsonapiMeta,
      };
      bodySchema.properties.data.properties.meta = {
        type: "object",
        properties: {
          external_data: {
            type: "object",
            properties: {
              PascalCase: {
                type: string,
              },
              camelCase: {
                type: string,
              },
            },
          },
        },
      };
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/vnd.api+json": {
                      schema: bodySchema as unknown as OpenAPIV3.SchemaObject,
                    },
                  },
                },
              },
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("fails when meta keys are not snake case", async () => {
      const bodySchema = {
        ...jsonapiMeta,
      };
      bodySchema.properties.data.properties.meta = {
        type: "object",
        properties: {
          externalData: {
            type: "object",
            properties: {},
          },
        },
      };
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: bodySchema as unknown as OpenAPIV3.SchemaObject,
                    },
                  },
                },
              },
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      console.log(results.filter((r) => !r.passed));
      expect(results.filter((r) => !r.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where:
              "GET /example response 200 response body: application/json property data/meta/externalData",
            error: "expected externalData to be snake case",
          }),
        ]),
      );
      expect(results.every((result) => result.passed)).toBe(false);
    });
  });

  describe("timestamp properties", () => {
    test("passes when timestamp property formatted correctly in request", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            post: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        tested_at: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        additionalProperties: false,
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("fails when timestamp property not formatted correctly in request", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            post: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            attributes: {
                              type: "object",
                              properties: {
                                tested_at: { type: "string", format: "uuid" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.filter((r) => !r.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where:
              "POST /example request body: application/json property: data/attributes/tested_at",
            error:
              "expected property name ending in '_at' to have format date-time",
          }),
        ]),
      );
      console.log(results.filter((r) => !r.passed));
      expect(results.every((result) => result.passed)).toBe(false);
    });

    test("passes when timestamp property formatted correctly in response", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          tested_at: { type: "string", format: "date-time" },
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("fails when timestamp property not formatted correctly in response", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              attributes: {
                                type: "object",
                                properties: {
                                  tested_at: { type: "string", format: "uuid" },
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
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where:
              "GET /example response 200 response body: application/json property data/attributes/tested_at",
            error: "expected property to have format date-time",
          }),
        ]),
      );
      expect(results.every((result) => result.passed)).toBe(false);
    });
  });

  describe("required properties", () => {
    const requiredOk: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: {
            something: {
              type: "string",
            },
            else: {
              type: "number",
            },
          },
          required: ["something"],
        },
        foo: {
          type: "string",
        },
      },
      required: ["data"],
    };
    test("passes when required properties are declared", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            post: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: requiredOk,
                  },
                },
              },
              responses: {
                "200": {
                  description: "ok",
                  content: {
                    "application/json": {
                      schema: requiredOk,
                    },
                  },
                },
              },
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    const missingRequiredTopLevel: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        something: {
          type: "string",
        },
      },
      required: ["something_else"],
    };
    const missingRequiredNested: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: {
            something: {
              type: "string",
            },
          },
          required: ["something_else"],
        },
      },
    };
    test("fails when required properties are missing in request body, top-level", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: missingRequiredTopLevel,
                  },
                },
              },
              responses: {},
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results.filter((result) => !result.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            error: "missing required property something_else",
          }),
        ]),
      );
    });
    test("fails when required properties are missing in request body, nested", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: missingRequiredNested,
                  },
                },
              },
              responses: {},
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results.filter((result) => !result.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            error: "missing required property data.something_else",
          }),
        ]),
      );
    });
    test("fails when required properties are missing in response, top-level", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: missingRequiredTopLevel,
                    },
                  },
                },
              },
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results.filter((result) => !result.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            error: "missing required property something_else",
          }),
        ]),
      );
    });
    test("fails when required properties are missing in response, nested", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: missingRequiredNested,
                    },
                  },
                },
              },
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results.filter((result) => !result.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            error: "missing required property data.something_else",
          }),
        ]),
      );
    });
  });

  describe("array properties", () => {
    test("fails if items have no type information", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {},
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results.filter((result) => !result.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            error: "type was not found array items",
          }),
        ]),
      );
    });
    test("succeeds if items have type", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {
                              type: "string",
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("succeeds if items have oneOf schema", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {
                              oneOf: [{ type: "string" }],
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("succeeds if items have allOf schema", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {
                              allOf: [{ type: "string" }],
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("succeeds if items have anyOf schema", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {
                              anyOf: [{ type: "string" }],
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("fails if composite in items has no type", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {
                              anyOf: [],
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results.filter((result) => !result.passed)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            error: "type was not found array items",
          }),
        ]),
      );
    });

    test("succeeds if items have fully-defined nested composite array type", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {
                              anyOf: [
                                { type: "string" },
                                {
                                  allOf: [
                                    { type: "number" },
                                    { anyOf: [{ type: "boolean" }] },
                                  ],
                                },
                              ],
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("fails if items have incomplete-defined nested composite array type", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          things: {
                            type: "array",
                            items: {
                              anyOf: [{ type: "string" }, { allOf: [] }],
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
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(afterSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
    });
  });

  describe("breaking changes", () => {
    test("fails if a property is removed", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const beforeSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          count: { type: "number" },
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
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(beforeSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("passes if spec is removed", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const beforeSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {},
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(beforeSpec, baseOpenAPI),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test("fails if a required property is added", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const beforeSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {},
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      };
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        count: { type: "number" },
                      },
                      required: ["count"],
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(beforeSpec, afterSpec),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("passes if a property is removed in experimental", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const beforeSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          count: { type: "number" },
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
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
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
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(beforeSpec, afterSpec),
        context: {
          ...context,
          changeVersion: {
            date: "2021-10-10",
            stability: "experimental",
          },
        },
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test("passes if a required property is added in experimental", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);
      const beforeSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {},
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      };
      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        count: { type: "number" },
                      },
                      required: ["count"],
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      };
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(beforeSpec, afterSpec),
        context: {
          ...context,
          changeVersion: {
            date: "2021-10-10",
            stability: "experimental",
          },
        },
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });

  describe("disallowAdditionalPropertiesResponse", () => {
    test("fails when additionalProperties is not set to false for new endpoints", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);

      const beforeSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {},
      };

      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "A response from a new endpoint",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          invalid_property: { type: "string" },
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

      const ruleInputs = {
        ...TestHelpers.createRuleInputs(beforeSpec, afterSpec),
        context: {
          ...context,
          operation: {
            change: "added",
          },
          custom: {
            changeVersion: {
              stability: "stable",
            },
          },
        },
      };

      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      const hasError = results.some((result) =>
        result.error?.includes(
          "New endpoints must set additionalProperties to false in response schemas",
        ),
      );

      expect(hasError).toBe(true);
    });

    test("passes when additionalProperties is set to false for new endpoints", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);

      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          valid_property: { type: "string" },
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

      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context: {
          ...context,
          operation: {
            change: "added",
          },
        },
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test("does nothing when additionalProperties is set to false for existing endpoints", async () => {
      const ruleRunner = new RuleRunner([propertyRules]);

      const afterSpec: OpenAPIV3.Document = {
        ...baseOpenAPI,
        paths: {
          "/example": {
            get: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          valid_property: { type: "string" },
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

      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseOpenAPI, afterSpec),
        context,
      };

      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
    });
  });
});
