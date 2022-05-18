import path from "path";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { ResultWithSourcemap } from "@useoptic/openapi-utilities";
import {
  sourcemapReader,
  parseOpenAPIWithSourcemap,
} from "@useoptic/openapi-io";
import { resourceRules as rules } from "../index";

const ruleRunner = new RuleRunner(rules);

describe("end-end-tests", () => {
  const inputsDir = path.resolve(
    path.join(__dirname, "../../../end-end-tests/api-standards"),
  );

  const resourceDate = (resource: string, date: string) =>
    path.join(inputsDir, "resources", resource, date);

  it("fails when operation is removed", async () => {
    const results = await snapshotScenario(
      "000-baseline-beta.yaml",
      "001-fail-operation-removed-beta.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "beta",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  it("fails when breaking param change", async () => {
    const results = await snapshotScenario(
      "000-baseline-beta.yaml",
      "001-fail-breaking-param-change-beta.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "beta",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(false);

    expect(results).toMatchSnapshot();
  });

  it("passes when property field added to response", async () => {
    const results = await snapshotScenario(
      "000-baseline.yaml",
      "001-ok-add-property-field.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "beta",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(true);

    expect(results).toMatchSnapshot();
  });

  it("passes when property operation added", async () => {
    const results = await snapshotScenario(
      "000-baseline.yaml",
      "002-ok-add-operation.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "beta",
        },
        resourceVersions: {},
      },
    );

    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it("fails when it doesn't meet JSON:API rules", async () => {
    const results = await snapshotScenario(
      "000-baseline.yaml",
      "003-jsonapi.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "beta",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results).toMatchSnapshot();
  });

  const rootOfRepo = path.resolve(path.join(__dirname, "../../../"));

  async function snapshotScenario(
    from: string | undefined,
    to: string | undefined,
    workingDir: string,
    context: any,
  ) {
    const parsedFrom = from
      ? await parseOpenAPIWithSourcemap(path.join(workingDir, from))
      : undefined;
    const parsedTo = to
      ? await parseOpenAPIWithSourcemap(path.join(workingDir, to))
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
