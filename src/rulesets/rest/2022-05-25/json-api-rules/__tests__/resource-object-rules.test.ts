import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { resourceObjectRules } from "../resource-object-rules";
const baseJson = TestHelpers.createEmptySpec();

describe("resource object rules", () => {
  describe("valid PATCH requests", () => {
    test("passes when bulk PATCH request body is of the correct form with id format uuid and response status code 204", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            patch: {
              responses: {
                "204": {
                  description: "It's a bulk PATCH. Nothing to see here.",
                },
              },
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test.each(["uuid", "uri", "ulid"])(
      "passes when PATCH request body is of the correct form identified by %s",
      async (format) => {
        const afterJson = {
          ...baseJson,
          paths: {
            "/api/example/{example_id}": {
              patch: {
                responses: {}, // not tested here
                requestBody: {
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
                                format: format,
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
      },
    );

    test.each(["uuid", "uri", "ulid"])(
      "passes when PATCH request body for a relationship is of the correct form (data is an collection of resource objects with id and type)",
      async (format) => {
        const afterJson = {
          ...baseJson,
          paths: {
            "/api/example/relationships/example": {
              patch: {
                responses: {}, // not tested here
                requestBody: {
                  content: {
                    "application/vnd.api+json": {
                      schema: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                type: {
                                  type: "string",
                                },
                                id: {
                                  type: "string",
                                  format: format,
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
      },
    );

    test("fails when PATCH request body for a relationship is of incorrect form (missing id from collection of resource objects in data)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example/relationships/example": {
            patch: {
              responses: {}, // not tested here
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: {
                                type: "string",
                              },
                              // Should have an id here.
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where:
              "PATCH /api/example/relationships/example request body: application/vnd.api+json",
            name: "request body for relationship post/patch/delete",
            error: "Expected a partial match",
          }),
        ]),
      );
    });
  });

  describe("valid POST requests", () => {
    test("passes when POST request body is of the correct form (data is a single object with type, attributes)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            post: {
              responses: {}, // not tested here
              requestBody: {
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
                            attributes: {
                              type: "object",
                              properties: {
                                something: {
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
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
    });

    test.each(["uuid", "uri", "ulid"])(
      "passes when POST request body for a relationship is of the correct form (data is collection of resource objects with type and id)",
      async (format) => {
        const afterJson = {
          ...baseJson,
          paths: {
            "/api/example/relationships/example": {
              post: {
                responses: {}, // not tested here
                requestBody: {
                  content: {
                    "application/vnd.api+json": {
                      schema: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                type: {
                                  type: "string",
                                },
                                id: {
                                  type: "string",
                                  format: format,
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
      },
    );

    test("fails when POST request body for a relationship is of incorrect form (missing id from resource objects in data array)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example/relationships/example": {
            post: {
              responses: {}, // not tested here
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: {
                                type: "string",
                              },
                              // Should have an id here.
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where:
              "POST /api/example/relationships/example request body: application/vnd.api+json",
            name: "request body for relationship post/patch/delete",
            error: "Expected a partial match",
          }),
        ]),
      );
    });

    test("passes when bulk POST request body is of the correct form (data is an collection of resource objects with type and attributes)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            post: {
              responses: {
                "204": {
                  description: "it's a bulk POST y'all",
                },
              },
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);

      expect(results.every((result) => result.passed)).toBe(true);
    });
  });

  describe("invalid PATCH requests", () => {
    test("fails when PATCH request body is not of the correct form (data is missing required fields attributes/type)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example/{example_id}": {
            patch: {
              responses: {}, // not tested here
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        something: {
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
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where:
              "PATCH /api/example/{example_id} request body: application/vnd.api+json",
            name: "request body for patch",
            error: "Expected at least one partial match",
          }),
        ]),
      );
    });
  });

  describe("invalid POST requests", () => {
    test("fails when POST request body is not of the correct form (missing required fields attributes/type)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            post: {
              responses: {}, // not tested here
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        something: {
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
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where: "POST /api/example request body: application/vnd.api+json",
            name: "request body for post",
            error: "Expected a partial match",
          }),
        ]),
      );
    });

    test("fails when bulk POST request body is not the correct form (bulk post data should be collection of resource objects)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            post: {
              responses: {
                "204": {
                  description: "it's a bulk POST y'all",
                },
              }, // not tested here
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        something: {
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
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where: "POST /api/example request body: application/vnd.api+json",
            name: "request body for bulk post",
            error: "Expected a partial match",
          }),
        ]),
      );
    });

    test("fails when bulk POST request array elements are not of the correct form (missing required fields type/attributes)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            post: {
              responses: {
                "204": {
                  description: "it's a bulk POST y'all",
                },
              }, // not tested here
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              something: {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where: "POST /api/example request body: application/vnd.api+json",
            name: "request body for bulk post",
            error: "Expected a partial match",
          }),
        ]),
      );
    });

    test("fails when bulk POST request body is a resource object instead of a collection", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example": {
            post: {
              responses: {
                "204": {
                  description: "it's a bulk POST y'all",
                },
              },
              requestBody: {
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
                            attributes: {
                              type: "object",
                              properties: {
                                something: {
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
        },
      } as OpenAPIV3.Document;

      const ruleRunner = new RuleRunner([resourceObjectRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where: "POST /api/example request body: application/vnd.api+json",
            name: "request body for bulk post",
            error: "Expected a partial match",
          }),
        ]),
      );
    });
  });

  describe("valid GET responses", () => {
    test.each(["uuid", "uri", "ulid"])(
      "passes when status code 200 has the correct JSON body identified by %s",
      async (format) => {
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
                                  format: format,
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      },
    );
  });

  describe("valid POST responses", () => {
    test.each(["uuid", "uri", "ulid"])(
      "passes when status code 201 has the correct headers and body identified by %s",
      async (format) => {
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
                                  format: format,
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
                  // No location header required for a 204 response.
                  "204": {
                    description: "success",
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      },
    );
  });

  describe("valid PATCH responses", () => {
    test.each(["uuid", "uri", "ulid"])(
      "passes when status code 200 has the correct body identified by %s",
      async (format) => {
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
                                  format: format,
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      },
    );

    test.each([true, false])(
      "passes when status code 200 has the correct body, meta only, singleton=%s",
      async (isSingleton) => {
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      },
    );

    test("passes when singleton status code 200 has the correct body (data is a single resource object)", async () => {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });

  describe("valid DELETE responses", () => {
    test("passes when status code 200 has the correct body (jsonapi/meta fields in content)", async () => {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test.each(["uuid", "uri", "ulid"])(
      "passes when DELETE request body for a relationship is of the correct form (data is collection of resource objects)",
      async (format) => {
        const afterJson = {
          ...baseJson,
          paths: {
            "/api/example/relationships/example": {
              delete: {
                responses: {}, // not tested here
                requestBody: {
                  content: {
                    "application/vnd.api+json": {
                      schema: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                type: {
                                  type: "string",
                                },
                                id: {
                                  type: "string",
                                  format: format,
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
      },
    );

    test("fails when DELETE request body for a relationship is of incorrect form (resource objects in collection missing id)", async () => {
      const afterJson = {
        ...baseJson,
        paths: {
          "/api/example/relationships/example": {
            delete: {
              responses: {}, // not tested here
              requestBody: {
                content: {
                  "application/vnd.api+json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: {
                                type: "string",
                              },
                              // Should have an id here.
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where:
              "DELETE /api/example/relationships/example request body: application/vnd.api+json",
            name: "request body for relationship post/patch/delete",
            error: "Expected a partial match",
          }),
        ]),
      );
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
      async (path) => {
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
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

    test("fails when GET singleton has an empty data object", async () => {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
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

  describe("invalid PATCH responses", () => {
    test("fails when content is specified for 204 status codes", async () => {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("fails when status code 200 missing resource id", async () => {
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
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
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
      async (isSingleton) => {
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
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(false);
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
});
