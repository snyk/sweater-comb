import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "../../__tests__/fixtures";
import { statusCodesRules } from "../status-code-rules";
import { validPost2xxCodes } from "../../../2022-05-25/utils";

const baseJson = TestHelpers.createEmptySpec();

describe("status code rules", () => {
  test("fails when an invalid 4xx status code is specified", async () => {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid delete 2xx code is specified", async () => {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid post 2xx code is specified", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          post: {
            responses: {
              "206": {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid get 2xx code is specified", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          get: {
            responses: {
              "203": {
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "valid 2xx status codes for get",
          error: "expected GET response to only support 200, not 203",
        }),
      ]),
    );
  });

  test("fails when an invalid batch post 2xx code is specified", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users": {
          post: {
            requestBody: {
              content: {
                "application/vnd.api+json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {},
                      },
                    },
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results.filter((result) => !result.passed)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error:
            "expected POST response for batches to only support {202,204}, not 200",
        }),
      ]),
    );
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid batch post request is specified", async () => {
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
              "206": {
                description: "i am not valid",
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);

    expect(results.every((result) => result.passed)).toBe(false);
    expect(results.filter((result) => !result.passed)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error: `expected POST response to only support status code(s) {${validPost2xxCodes.toString()}}, not 206`,
        }),
      ]),
    );
    expect(results).toMatchSnapshot();
  });

  test("passes for a valid batch post 204 code", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users": {
          post: {
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
                            id: "some-id",
                            type: "some-type",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "204": {
                description: "got it",
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  test("passes for a valid batch post 202 code", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users": {
          post: {
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
                            id: "some-id",
                            type: "some-type",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "202": {
                description: "request accepted",
                headers: {
                  "content-location": "test",
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  test("passes for a valid delete 202 code", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}": {
          delete: {
            responses: {
              "202": {
                description: "request accepted",
                headers: {
                  "content-location": "test",
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  test("fails when an invalid relationship post request is specified", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}/relationships": {
          post: {
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
                            id: "some-id",
                            type: "some-type",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "206": {
                description: "invalid :'(",
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);

    expect(results.every((result) => result.passed)).toBe(false);
    expect(results.filter((result) => !result.passed)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error: `expected relationship POST response to only support status code(s) {${validPost2xxCodes.toString()}}, not 206`,
        }),
      ]),
    );
    expect(results).toMatchSnapshot();
  });

  test("passes for a valid relationship post 200 code", async () => {
    const afterJson = {
      ...baseJson,
      paths: {
        "/api/users/{user_id}/relationships/somethings": {
          post: {
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
                            id: "some-id",
                            type: "some-type",
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
                description: "got it",
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
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });
});
