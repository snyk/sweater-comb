import { rules } from "../properties";
import { SynkApiCheckContext } from "../../dsl";

import { createSnykTestFixture } from "./fixtures";
import { OpenAPIV3 } from "@useoptic/openapi-utilities";

const { compare } = createSnykTestFixture();
// todo: fix copy/paste
const emptyContext: SynkApiCheckContext = {
  changeDate: "2021-10-10",
  changeResource: "Example",
  changeVersion: {
    date: "2021-10-10",
    stability: "ga",
  },
  resourceVersions: {},
};

describe("body properties", () => {
  const baseOpenAPI = {
    openapi: "3.0.1",
    paths: {
      "/example": {
        get: {
          responses: {},
        },
      },
    },
    info: { version: "0.0.0", title: "OpenAPI" },
  };

  describe("key", () => {
    it("passes when snake case with more than one component", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.propertyKey, emptyContext);

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });

    it("passes when snake case with a number as an n+1 component ", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.propertyKey, emptyContext);

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });    it("fails when number in n=1 snake case component ", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.propertyKey, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("passes when snake case with one component", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.propertyKey, emptyContext);

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });

    it("fails when not snake case", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.propertyKey, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("fails when not snake case in experimental", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.propertyKey, {
          ...emptyContext,
          changeVersion: {
            date: "2021-10-10",
            stability: "experimental",
          },
        });

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("fails when not snake case in nested field", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.propertyKey, emptyContext);

      expect(result.results[1].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });

  const baseOpenApiWithResponse: OpenAPIV3.Document = {
    openapi: "3.0.1",
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
                      notSnakeCase: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    info: { version: "0.0.0", title: "OpenAPI" },
  };

  it("allows non-snake case if already in spec", async () => {
    const result = await compare(baseOpenApiWithResponse)
      .to((spec) => {
        return spec;
      })
      .withRule(rules.propertyKey, emptyContext);

    expect(result.results).toHaveLength(0);
    expect(result).toMatchSnapshot();
  });

  describe("breaking changes", () => {
    it("fails if a property is removed", async () => {
      const base = JSON.parse(JSON.stringify(baseOpenAPI));
      base.paths!["/example"]!.get!.responses = {
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
      };
      const result = await compare(base)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.preventRemoval, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
    it("fails if a required property is added", async () => {
      const base = JSON.parse(JSON.stringify(baseOpenAPI));
      base.paths!["/example"]!.get!.requestBody = {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {},
            },
          },
        },
      };
      const result = await compare(base)
        .to((spec) => {
          spec.paths!["/example"]!.get!.requestBody = {
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
          };
          return spec;
        })
        .withRule(rules.preventAddingRequiredRequestProperties, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
    it("passes if a property is removed in experimental", async () => {
      const base = JSON.parse(JSON.stringify(baseOpenAPI));
      base.paths!["/example"]!.get!.responses = {
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
      };
      const result = await compare(base)
        .to((spec) => {
          spec.paths!["/example"]!.get!.responses = {
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
          };
          return spec;
        })
        .withRule(rules.preventRemoval, {
          ...emptyContext,
          changeVersion: {
            date: "2021-10-10",
            stability: "experimental",
          },
        });

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });
    it("passes if a required property is added in experimental", async () => {
      const base = JSON.parse(JSON.stringify(baseOpenAPI));
      base.paths!["/example"]!.get!.requestBody = {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {},
            },
          },
        },
      };
      const result = await compare(base)
        .to((spec) => {
          spec.paths!["/example"]!.get!.requestBody = {
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
          };
          return spec;
        })
        .withRule(rules.preventAddingRequiredRequestProperties, {
          ...emptyContext,
          changeVersion: {
            date: "2021-10-10",
            stability: "experimental",
          },
        });

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });
  });
});
