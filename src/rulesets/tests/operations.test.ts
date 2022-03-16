import { rules } from "../operations";
import { SnykApiCheckDsl, SynkApiCheckContext } from "../../dsl";

import { createSnykTestFixture } from "./fixtures";
import { defaultEmptySpec } from "@useoptic/openapi-utilities";
const { compare } = createSnykTestFixture();

const emptyContext: SynkApiCheckContext = {
  changeDate: "2021-10-10",
  changeResource: "Example",
  changeVersion: {
    date: "2021-10-10",
    stability: "ga",
  },
  resourceVersions: {},
};

describe("operationId", () => {
  const baseForOperationIdTests = {
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

  describe("missing", () => {
    it("fails if empty string", async () => {
      const result = await compare(baseForOperationIdTests)
        .to((spec) => {
          spec.paths!["/example"]!.get!.operationId = "";
          return spec;
        })
        .withRule(rules.operationId, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("fails if undefined", async () => {
      const result = await compare(baseForOperationIdTests)
        .to((spec) => {
          delete spec.paths!["/example"]!.get!.operationId;
          return spec;
        })
        .withRule(rules.operationIdSet, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });

  describe("when set", () => {
    it("fails if prefix is wrong", async () => {
      const result = await compare(baseForOperationIdTests)
        .to((spec) => {
          spec.paths!["/example"]!.get!.operationId = "findHelloWorld";
          return spec;
        })
        .withRule(rules.operationId, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("fails if not camel case", async () => {
      const result = await compare(baseForOperationIdTests)
        .to((spec) => {
          spec.paths!["/example"]!.get!.operationId = "get-hello-world";
          return spec;
        })
        .withRule(rules.operationId, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });

  it("fails when camel case and valid prefix but no suffix", async () => {
    const result = await compare(baseForOperationIdTests)
      .to((spec) => {
        spec.paths!["/example"]!.get!.operationId = "get";
        return spec;
      })
      .withRule(rules.operationId, emptyContext);

    expect(result.results[0].passed).toBeFalsy();
    expect(result).toMatchSnapshot();
  });

  it("passes when camel case and has a hump", async () => {
    const result = await compare(baseForOperationIdTests)
      .to((spec) => {
        spec.paths!["/example"]!.get!.operationId = "getYesHump";
        return spec;
      })
      .withRule(rules.operationId, emptyContext);

    expect(result.results[0].passed).toBeTruthy();
    expect(result).toMatchSnapshot();
  });

  it("fails if removed", async () => {
    const baseCopy = JSON.parse(JSON.stringify(baseForOperationIdTests));
    baseCopy.paths["/example"].get.operationId = "example";
    const result = await compare(baseCopy)
      .to((spec) => {
        delete spec.paths!["/example"]!.get!.operationId;
        return spec;
      })
      .withRule(rules.removingOperationId, emptyContext);

    expect(result.results[0].passed).toBeFalsy();
    expect(result).toMatchSnapshot();
  });

  it("fails if changed", async () => {
    // todo: fix copy/paste
    const baseCopy = JSON.parse(JSON.stringify(baseForOperationIdTests));
    baseCopy.paths["/example"].get.operationId = "example";
    const result = await compare(baseCopy)
      .to((spec) => {
        spec.paths!["/example"]!.get!.operationId = "example2";
        return spec;
      })
      .withRule(rules.removingOperationId, emptyContext);

    expect(result.results[0].passed).toBeFalsy();
    expect(result).toMatchSnapshot();
  });
});

describe("orgOrGroupTenant", () => {
  const baseForSpecificationTests = {
    openapi: "3.0.1",
    paths: {},
    info: { version: "0.0.0", title: "OpenAPI" },
  };
  const someOperation = {
    get: {
      responses: {},
    },
  };

  it.each`
    valid    | path
    ${false} | ${""}
    ${false} | ${"/thing"}
    ${false} | ${"/org/{org_id}"}
    ${false} | ${"/group/{group_id}"}
    ${true}  | ${"/orgs"}
    ${false} | ${"/orgs/thing"}
    ${true}  | ${"/orgs/{org_id}/thing"}
    ${true}  | ${"/groups"}
    ${false} | ${"/groups/thing"}
    ${true}  | ${"/groups/{group_id}/thing"}
    ${true}  | ${"/self"}
    ${false} | ${"/self/thing"}
    ${true}  | ${"/test"}
    ${true}  | ${"/test/docker/golang:1.18"}
  `(`path '$path' is valid: $valid`, async ({ valid, path }) => {
    const result = await compare(baseForSpecificationTests)
      .to((spec) => {
        spec.paths![path] = someOperation;
        return spec;
      })
      .withRule(rules.orgOrGroupTenant, emptyContext);

    const passed = result.results[0].passed;
    valid ? expect(passed).toBeTruthy() : expect(passed).toBeFalsy();

    expect(result).toMatchSnapshot();
  });

  it.each(["org", "group"])(
    "fails with both valid and invalid %s tenants",
    async (tenantType) => {
      const result = await compare(baseForSpecificationTests)
        .to((spec) => {
          spec.paths![`/${tenantType}s/{${tenantType}_id}/thing`] =
            someOperation;
          spec.paths!["/bad-lieu-tenant"] = someOperation;
          return spec;
        })
        .withRule(rules.orgOrGroupTenant, emptyContext);

      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ passed: true }),
          expect.objectContaining({ passed: false }),
        ]),
      );
      expect(result).toMatchSnapshot();
    },
  );
});

const baseForOperationMetadataTests = {
  openapi: "3.0.1",
  paths: {
    "/example": {
      get: {
        tags: ["Example"],
        operationId: "getExample",
        summary: "Retrieve example",
        responses: {},
      },
    },
  },
  info: { version: "0.0.0", title: "OpenAPI" },
};

describe("operation metadata", () => {
  describe("summary", () => {
    it("fails if missing", async () => {
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => {
          delete spec.paths!["/example"]!.get!.summary;
          return spec;
        })
        .withRule(rules.summary, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("passes if provided", async () => {
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => {
          spec.paths!["/example"]!.get!.summary = "I have a summary";
          return spec;
        })
        .withRule(rules.summary, emptyContext);

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });
  });

  describe("tags", () => {
    it("passes if > 1 tag provided", async () => {
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => spec)
        .withRule(rules.tags, emptyContext);

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });

    it("fail is not provided", async () => {
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => {
          delete spec.paths!["/example"]!.get!.tags;
          return spec;
        })
        .withRule(rules.tags, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });
});

describe("operation parameters", () => {
  describe("names", () => {
    it("fails if the case isn't correct", async () => {
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => {
          delete spec.paths!["/example"];
          spec.paths!["/example/{pathParameter}"] = {
            get: {
              parameters: [
                {
                  in: "path",
                  name: "pathParameter",
                },
              ],
              responses: {},
            },
          };
          return spec;
        })
        .withRule(rules.parameterCase, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("passes if the case is correct", async () => {
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => {
          delete spec.paths!["/example"];
          spec.paths!["/example/{path_parameter}"] = {
            get: {
              parameters: [
                {
                  in: "path",
                  name: "path_parameter",
                },
              ],
              responses: {},
            },
          };
          return spec;
        })
        .withRule(rules.parameterCase, emptyContext);

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });

    it("fails when adding a required query parameter", async () => {
      // const base = JSON.parse(JSON.stringify(baseForOperationMetadataTests));
      // base.paths!["/example"]!.get!.parameters = [];
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => {
          spec.paths!["/example"]!.get!.parameters = [
            {
              in: "query",
              name: "query_parameter",
              required: true,
            },
          ];
          return spec;
        })
        .withRule(rules.preventAddingRequiredQueryParameters, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("allows adding a required query parameter to a new operation", async () => {
      // const base = JSON.parse(JSON.stringify(baseForOperationMetadataTests));
      // base.paths!["/example"]!.get!.parameters = [];
      const result = await compare(defaultEmptySpec)
        .to((spec) => {
          spec.paths["/example"] = {
            get: {
              parameters: [
                {
                  in: "query",
                  name: "query_parameter",
                  required: true,
                },
              ],
              responses: {},
            },
          };
          return spec;
        })
        .withRule(rules.preventAddingRequiredQueryParameters, emptyContext);

      expect(result.results[0].passed).toBeTruthy();
      expect(result).toMatchSnapshot();
    });

    it("fails when changing optional to required query parameter", async () => {
      const base = JSON.parse(JSON.stringify(baseForOperationMetadataTests));
      base.paths!["/example"]!.get!.parameters = [
        {
          in: "query",
          name: "query_parameter",
        },
      ];
      const result = await compare(base)
        .to((spec) => {
          spec.paths!["/example"]!.get!.parameters = [
            {
              in: "query",
              name: "query_parameter",
              required: true,
            },
          ];
          return spec;
        })
        .withRule(
          rules.preventChangingOptionalToRequiredQueryParameters,
          emptyContext,
        );

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("fails if the default value is changed", async () => {
      const base = JSON.parse(JSON.stringify(baseForOperationMetadataTests));
      base.paths!["/example"]!.get!.parameters = [
        {
          in: "query",
          name: "query_parameter",
          schema: {
            type: "string",
            default: "before",
          },
        },
      ];
      const result = await compare(base)
        .to((spec) => {
          spec.paths!["/example"]!.get!.parameters = [
            {
              in: "query",
              name: "query_parameter",
              schema: {
                type: "string",
                default: "after",
              },
            },
          ];
          return spec;
        })
        .withRule(rules.preventChangingParameterDefaultValue, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });

  describe("status codes", () => {
    it("fails when a status codes is removed", async () => {
      const base = JSON.parse(JSON.stringify(baseForOperationMetadataTests));
      base.paths["/example"].get.responses = {
        "200": {
          description: "Example response",
        },
      };
      const result = await compare(base)
        .to((spec) => {
          delete spec.paths!["/example"]!.get!.responses!["200"];
          return spec;
        })
        .withRule(rules.preventRemovingStatusCodes, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });

  describe("version parameter", () => {
    it("fails when there is no version parameter", async () => {
      const result = await compare(baseForOperationMetadataTests)
        .to((spec) => spec)
        .withRule(rules.versionParameter, emptyContext);

      expect(result.results[0].passed).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });

  it("fails adding put method", async () => {
    const result = await compare(defaultEmptySpec)
      .to({
        openapi: "3.0.1",
        paths: {
          "/example": {
            put: {
              responses: {},
            },
          },
        },
        info: { version: "0.0.0", title: "OpenAPI" },
      })
      .withRule(rules.noPutHttpMethod, emptyContext);
    expect(result.results[0].passed).toBeFalsy();
    expect(result).toMatchSnapshot();
  });
});
