import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "./fixtures";

import { specificationRules } from "../specification-rules";
import { stabilityKey } from "../constants";

const baseJson = TestHelpers.createEmptySpec();

describe("specification rules", () => {
  test("fails when components are not PascalCase", async () => {
    const afterJson = {
      ...baseJson,
      [stabilityKey]: "wip",
      paths: {},
      components: {
        parameters: {
          OrgId: {
            name: "orgId",
            in: "path",
          },
          ThingId: {
            name: "thingId",
            in: "path",
          },
          "io.snyk.something.ThingResourceResponse.notSnakey": {
            name: "not-snakey",
            in: "header",
          },
        },
        schemas: {
          thingResourceResponse: {
            type: "object",
            description: "Response containing a single thing resource object",
            properties: {},
          },
          "IO.SNYK.SOMETHING.ThingResourceResponse": {
            type: "object",
            description: "Response containing a single thing resource object",
            properties: {},
          },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([specificationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("passes when components are namespaced PascalCase", async () => {
    const afterJson = {
      ...baseJson,
      [stabilityKey]: "wip",
      paths: {},
      components: {
        schemas: {
          "something.ThingResourceResponse": {
            type: "object",
            description: "Response containing a single thing resource object",
            properties: {},
          },
          "io.snyk.something.ThingResourceResponse": {
            type: "object",
            description: "Response containing a single thing resource object",
            properties: {},
          },
        },
        parameters: {
          "io.snyk.something.SomeApiRequest.some_param": {
            in: "path",
            name: "some_param",
          },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([specificationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  test("fails if a discriminator with mapping is used without oneOf", async () => {
    const afterJson = {
      ...baseJson,
      [stabilityKey]: "wip",
      paths: {},
      components: {
        parameters: {
          OrgId: {
            name: "orgId",
            in: "path",
          },
          ThingId: {
            name: "thingId",
            in: "path",
          },
        },
        schemas: {
          SchemaWithoutOneOf: {
            type: "object",
            description: "An object with discriminator but no oneOf",
            // No oneOf property here
            discriminator: {
              propertyName: "type",
              mapping: {
                dog: "#/components/schemas/Dog",
                cat: "#/components/schemas/Cat",
              },
            },
          },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([specificationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  test("passes if a discriminator with mapping is used with oneOf", async () => {
    const afterJson = {
      ...baseJson,
      [stabilityKey]: "wip",
      paths: {},
      components: {
        schemas: {
          Pet: {
            type: "object",
            description: "A valid oneOf schema with discriminator",
            oneOf: [
              { $ref: "#/components/schemas/Dog" },
              { $ref: "#/components/schemas/Cat" },
            ],
            discriminator: {
              propertyName: "type",
              mapping: {
                dog: "#/components/schemas/Dog",
                cat: "#/components/schemas/Cat",
              },
            },
          },
          Dog: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["dog"] },
              bark: { type: "boolean" },
            },
          },
          Cat: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["cat"] },
              purr: { type: "boolean" },
            },
          },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([specificationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  test("fails if there is a nested discriminator", async () => {
    const afterJson = {
      ...baseJson,
      [stabilityKey]: "wip",
      paths: {},
      components: {
        schemas: {
          Parent: {
            type: "object",
            description: "A schema with nested discriminators (invalid)",
            oneOf: [
              { $ref: "#/components/schemas/ChildWithDiscriminator" },
              { $ref: "#/components/schemas/OtherChild" },
            ],
            discriminator: {
              propertyName: "type",
              mapping: {
                nested: "#/components/schemas/ChildWithDiscriminator",
                other: "#/components/schemas/OtherChild",
              },
            },
          },
          ChildWithDiscriminator: {
            type: "object",
            oneOf: [
              { $ref: "#/components/schemas/Grandchild1" },
              { $ref: "#/components/schemas/Grandchild2" },
            ],
            discriminator: {
              propertyName: "subtype",
              mapping: {
                one: "#/components/schemas/Grandchild1",
                two: "#/components/schemas/Grandchild2",
              },
            },
          },
          OtherChild: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["other"] },
            },
          },
          Grandchild1: { type: "object" },
          Grandchild2: { type: "object" },
        },
      },
    } as OpenAPIV3.Document;
    const ruleRunner = new RuleRunner([specificationRules]);
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(baseJson, afterJson),
      context,
    };
    const results = await ruleRunner.runRulesWithFacts(ruleInputs);
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  describe("compiled specs", () => {
    test("fails when /openapi endpoint isn't specified", async () => {
      const afterJson: OpenAPIV3.Document = {
        ...baseJson,
        paths: {
          "/openapi": {},
        },
      };
      const ruleRunner = new RuleRunner([specificationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("fails when /openapi/{versions} endpoint isn't specified", async () => {
      const afterJson: OpenAPIV3.Document = {
        ...baseJson,
        paths: {
          "/openapi/{versions}": {},
        },
      };
      const ruleRunner = new RuleRunner([specificationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });
  });

  describe("uncompiled specs", () => {
    test("passes when /openapi endpoint isn't specified", async () => {
      const afterJson = {
        ...baseJson,
        [stabilityKey]: "wip",
        paths: {
          "/openapi/{versions}": {},
        },
      } as OpenAPIV3.Document;
      const ruleRunner = new RuleRunner([specificationRules]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, afterJson),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test("passes when /openapi/{versions} endpoint isn't specified", async () => {
      const afterJson = {
        ...baseJson,
        [stabilityKey]: "wip",
        paths: {
          "/openapi": {},
        },
      } as OpenAPIV3.Document;
      const ruleRunner = new RuleRunner([specificationRules]);
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
});
