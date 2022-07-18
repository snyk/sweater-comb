import path from "path";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import {
  ResultWithSourcemap,
  sourcemapReader,
} from "@useoptic/openapi-utilities";
import { parseOpenAPIWithSourcemap } from "@useoptic/openapi-io";
import { compiledRules as rules } from "../index";

const ruleRunner = new RuleRunner(rules);

describe("end-end-compiled-tests", () => {
  const inputsDir = path.resolve(
    path.join(__dirname, "../../../../../end-end-tests/api-standards/versions"),
  );

  it("passes when new experimental released", async () => {
    const results = await snapshotScenario(
      undefined,
      "2021-09-06~experimental/spec-baseline.yaml",
      {
        changeDate: "2021-09-06",
        changeVersion: {
          date: "2021-09-06",
          stability: "experimental",
        },
      },
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("passes when new beta released", async () => {
    const results = await snapshotScenario(
      undefined,
      "2021-09-06~beta/spec-baseline.yaml",
      {
        changeDate: "2021-09-06",
        changeVersion: {
          date: "2021-09-06",
          stability: "beta",
        },
      },
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it.each([undefined, "2021-09-06~experimental/spec-baseline.yaml"])(
    "fails without /openapi, from %s",
    async (from) => {
      const results = await snapshotScenario(
        from,
        "2021-09-06~experimental/spec-baseline-fail-no-openapi.yaml",
        {
          changeDate: "2021-09-06",
          changeVersion: {
            date: "2021-09-06",
            stability: "beta",
          },
        },
      );
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            error: "Expected route /openapi to be included",
          }),
          expect.objectContaining({
            error: "Expected route /openapi/{version} to be included",
          }),
        ]),
      );
      expect(results.every((result) => result.passed)).toBe(false);
    },
  );

  it("passes when endpoint removed after sunset", async () => {
    const results = await snapshotScenario(
      "2021-09-06~beta/spec-baseline.yaml",
      "2021-09-06~beta/spec-remove-get-sunset-2022-01-05.yaml",
      {
        changeDate: "2022-01-06",
        changeVersion: {
          date: "2021-09-06",
          stability: "beta",
        },
      },
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("fails when endpoint removed before sunset", async () => {
    const results = await snapshotScenario(
      "2021-09-06~beta/spec-baseline.yaml",
      "2021-09-06~beta/spec-remove-get-sunset-2022-01-05.yaml",
      {
        changeDate: "2021-11-06",
        changeVersion: {
          date: "2021-09-06",
          stability: "beta",
        },
      },
    );
    expect(results.every((result) => result.passed)).toBe(false);
  });

  const rootOfRepo = path.resolve(path.join(__dirname, "../../../../../"));

  async function snapshotScenario(
    from: string | undefined,
    to: string | undefined,
    context: any,
  ) {
    const parsedFrom = from
      ? await parseOpenAPIWithSourcemap(path.join(inputsDir, from))
      : undefined;
    const parsedTo = to
      ? await parseOpenAPIWithSourcemap(path.join(inputsDir, to))
      : undefined;

    const ruleInputs = {
      ...TestHelpers.createRuleInputs(
        parsedFrom?.jsonLike || TestHelpers.createEmptySpec(),
        parsedTo?.jsonLike || TestHelpers.createEmptySpec(),
      ),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);

    if (!parsedTo) {
      return results;
    }

    const { findFileAndLines } = sourcemapReader(parsedTo.sourcemap);
    const result: ResultWithSourcemap[] = await Promise.all(
      results.map(async (checkResult) => {
        const sourcemap = await findFileAndLines(
          checkResult.change.location.jsonPath,
        );

        const filePath = sourcemap?.filePath.split(rootOfRepo)[1];

        return {
          ...checkResult,
          sourcemap: {
            ...sourcemap,
            preview: "",
            filePath,
          },
          change: null as any,
        } as ResultWithSourcemap;
      }),
    );
    return result;
  }
});
