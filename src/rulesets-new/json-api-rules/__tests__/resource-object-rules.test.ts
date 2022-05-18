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
