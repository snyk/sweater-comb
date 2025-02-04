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
