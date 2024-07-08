import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { context } from "./fixtures";

import { lifecycleRuleset } from "../lifecycle-rules";
import { stabilityKey } from "../constants";

const baseJson = TestHelpers.createEmptySpec();

describe("lifecycle rules", () => {
  describe("stability", () => {
    test.each(["wip", "experimental", "beta", "ga"])(
      "a valid stability is provided - %s",
      async (stability) => {
        const ruleRunner = new RuleRunner([lifecycleRuleset]);
        const ruleInputs = {
          ...TestHelpers.createRuleInputs(baseJson, {
            ...baseJson,
            [stabilityKey]: stability,
          } as OpenAPIV3.Document),
          context,
        };
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);

        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      },
    );

    test("an invalid stability is provided", async () => {
      const ruleRunner = new RuleRunner([lifecycleRuleset]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, {
          ...baseJson,
          [stabilityKey]: "published",
        } as OpenAPIV3.Document),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    test("wip can be changed to another maturity", async () => {
      const ruleRunner = new RuleRunner([lifecycleRuleset]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(
          {
            ...baseJson,
            [stabilityKey]: "wip",
          } as OpenAPIV3.Document,
          {
            ...baseJson,
            [stabilityKey]: "ga",
          } as OpenAPIV3.Document,
        ),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(true);
      expect(results).toMatchSnapshot();
    });

    test("can not change from any stability but wip", async () => {
      const ruleRunner = new RuleRunner([lifecycleRuleset]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(
          {
            ...baseJson,
            [stabilityKey]: "ga",
          } as OpenAPIV3.Document,
          {
            ...baseJson,
            [stabilityKey]: "beta",
          } as OpenAPIV3.Document,
        ),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });
  });

  describe("sunset", () => {
    test("fails when the file was removed and not deprecated", async () => {
      const ruleRunner = new RuleRunner([lifecycleRuleset]);
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(baseJson, {
          ...baseJson,
          ["x-optic-ci-empty-spec"]: true,
        } as OpenAPIV3.Document),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });

    describe("schedule", () => {
      const sunsetContext = {
        changeDate: "2021-10-20",
        changeResource: "Example",
        changeVersion: {
          date: "2021-10-10",
          stability: "beta",
        },
        resourceVersions: {
          Example: {
            "2021-10-10": {
              beta: {
                deprecatedBy: {
                  date: "2021-10-20",
                  stability: "ga",
                },
              },
            },
          },
        },
      };

      test("fails when the schedule isn't met", async () => {
        const ruleRunner = new RuleRunner([lifecycleRuleset]);
        const ruleInputs = {
          ...TestHelpers.createRuleInputs(baseJson, {
            ...baseJson,
            ["x-optic-ci-empty-spec"]: true,
          } as OpenAPIV3.Document),
          context: sunsetContext,
        };
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(false);
        expect(results).toMatchSnapshot();
      });

      test("passes when the schedule is met", async () => {
        const ruleRunner = new RuleRunner([lifecycleRuleset]);
        const ruleInputs = {
          ...TestHelpers.createRuleInputs(baseJson, {
            ...baseJson,
            ["x-optic-ci-empty-spec"]: true,
          } as OpenAPIV3.Document),
          context: { ...sunsetContext, changeDate: "2022-02-01" },
        };
        const results = await ruleRunner.runRulesWithFacts(ruleInputs);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((result) => result.passed)).toBe(true);
        expect(results).toMatchSnapshot();
      });
    });
  });

  describe("experimental", () => {
    test("no new experimental endpoints", async () => {
      const ruleRunner = new RuleRunner([lifecycleRuleset]);
      // The types for createRuleInputs are wrong, null is perfectly valid when
      // this is a newly created spec
      const before = null as unknown as OpenAPIV3.Document;
      const ruleInputs = {
        ...TestHelpers.createRuleInputs(before, {
          ...baseJson,
          [stabilityKey]: "experimental",
        } as OpenAPIV3.Document),
        context,
      };
      const results = await ruleRunner.runRulesWithFacts(ruleInputs);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((result) => result.passed)).toBe(false);
      expect(results).toMatchSnapshot();
    });
  });
});
