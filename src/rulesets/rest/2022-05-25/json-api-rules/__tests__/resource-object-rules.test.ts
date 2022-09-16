import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { resourceObjectRules } from "../resource-object-rules";

const baseJson = TestHelpers.createEmptySpec();

describe("resource object rules", () => {
  describe("valid GET responses", () => {
    test("passes when status code 200 has the correct JSON body", () => {
      const afterJson = {
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
                            },
                          },
                          links: {
                            properties: {
                              self: {
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
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });

  describe("valid post shapes", () => {
    test("passes when status code 201 has the correct headers and body", () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            post: {
              responses: {
                "201": {
                  description: "",
                  headers: {
                    location: {},
                  },
                  content: {
                    "application/vnd.api+json": {
                      schema: {
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
                            },
                          },

                          links: {
                            properties: {
                              self: {
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
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });

  describe("valid patch shapes", () => {
    test("passes when status code 200 has the correct body", () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            patch: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/vnd.api+json": {
                      schema: {
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
                            },
                          },
                          jsonapi: {
                            type: "string",
                          },
                          links: {
                            properties: {
                              self: {
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
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test.each([true, false])(
      "passes when status code 200 has the correct body, meta only, singleton=%s",
      (isSingleton) => {
        const afterJson = {
          ...baseJson,
          paths: {
            "/api/example": {
              "x-snyk-resource-singleton": isSingleton,
              patch: {
                responses: {
                  "200": {
                    description: "",
                    content: {
                      "application/vnd.api+json": {
                        schema: {
                          type: "object",
                          properties: {
                            meta: {
                              what: "ever",
                            },
                            jsonapi: {
                              type: "string",
                            },
                            links: {
                              properties: {
                                self: {
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
          },
        } as OpenAPIV3.Document;

        const ruleRunner = new RuleRunner([resourceObjectRules]);
        const ruleInputs = {
          ...TestHelpers.createRuleInputs(baseJson, afterJson),
          context,
        };
        const results = ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      },
    );

    test("passes when singleton status code 200 has the correct body", () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            "x-snyk-resource-singleton": true,
            patch: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/vnd.api+json": {
                      schema: {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              type: {
                                type: "string",
                              },
                            },
                          },
                          jsonapi: {
                            type: "string",
                          },
                          links: {
                            properties: {
                              self: {
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
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });

  describe("valid delete shapes", () => {
    test("passes when status code 200 has the correct body", () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            delete: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/vnd.api+json": {
                      schema: {
                        type: "object",
                        properties: {
                          jsonapi: {
                            type: "string",
                          },
                          meta: {
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
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });

  describe("invalid GET responses", () => {
    const invalidGetPostResourceResponse = {
      "200": {
        description: "",
        content: {
          "application/vnd.api+json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  additionalProperties: {},
                },
                links: {
                  properties: {
                    self: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    test.each(["/api/example", "/api/example/{example_id}"])(
      "fails when GET %s response has an empty data object",
      (path) => {
        const afterJson = {
          ...baseJson,
          paths: {
            [path]: {
              get: {
                responses: invalidGetPostResourceResponse,
              },
            },
          },
        } as OpenAPIV3.Document;

        const ruleRunner = new RuleRunner([resourceObjectRules]);
        const ruleInputs = {
          ...TestHelpers.createRuleInputs(baseJson, afterJson),
          context,
        };
        const results = ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(false);
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              error: "Expected at least one partial match",
            }),
          ]),
        );
      },
    );

    test("fails when GET singleton has an empty data object", () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            "x-snyk-resource-singleton": true,
            get: {
              responses: invalidGetPostResourceResponse,
            },
          },
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      console.log(results.filter((r) => !r.passed));
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "valid get singleton response data schema",
            error: "Expected a partial match",
          }),
        ]),
      );
    });
  });

  describe("invalid patch shapes", () => {
    test("fails when content is specified for 204 status codes", () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            patch: {
              responses: {
                "204": {
                  description: "",
                  content: {
                    "application/vnd.api+json": {
                      schema: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
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

  test("fails when status code 200 missing resource id", () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/example": {
          patch: {
            responses: {
              "200": {
                description: "",
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            type: {
                              type: "string",
                            },
                          },
                        },
                        jsonapi: {
                          type: "string",
                        },
                        links: {
                          properties: {
                            self: {
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
      },
    } as OpenAPIV3.Document;

    const ruleRunner = new RuleRunner([resourceObjectRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "valid patch response data schema",
          passed: false,
          exempted: false,
          error: "Expected at least one partial match",
        }),
      ]),
    );
  });

  test.each([true, false])(
    "fails when status code 200 is empty, singleton=%s",
    (isSingleton) => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            "x-snyk-resource-singleton": isSingleton,
            patch: {
              responses: {
                "200": {
                  description: "",
                  content: {
                    "application/vnd.api+json": {
                      schema: {
                        type: "object",
                        properties: {
                          jsonapi: {
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
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      console.log(results.filter((r) => !r.passed));
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: isSingleton
              ? "valid patch singleton response data schema"
              : "valid patch response data schema",
            passed: false,
            exempted: false,
            error: "Expected at least one partial match",
          }),
          expect.objectContaining({
            name: "self links",
            passed: false,
            exempted: false,
            error: "Expected a partial match",
          }),
        ]),
      );
    },
  );
});
