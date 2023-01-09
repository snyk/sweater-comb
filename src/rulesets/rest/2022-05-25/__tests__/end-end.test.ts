import path from "path";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import {
  ResultWithSourcemap,
  sourcemapReader,
} from "@useoptic/openapi-utilities";
import { parseOpenAPIWithSourcemap } from "@useoptic/openapi-io";
import { resourceRules as rules } from "../index";

const ruleRunner = new RuleRunner(rules);

describe("end-end-tests", () => {
  const inputsDir = path.resolve(
    path.join(__dirname, "../../../../../end-end-tests/api-standards"),
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

  it("fails for the right reason with invalid parameters", async () => {
    const results = await snapshotScenario(
      undefined,
      "spec.yaml",
      resourceDate("repos", "2022-04-04"),
      {
        changeDate: "2022-05-27",
        changeResource: "repos",
        changeVersion: {
          date: "2022-04-04",
          stability: "experimental",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(false);
    expect(results.filter((result) => !result.passed)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error: "expected parameter name orgId to be snake case",
        }),
        expect.objectContaining({
          error: "expected parameter name repoId to be snake case",
        }),
        // This is a false positive on a pagination rule triggering. It triggers
        // because it fails to find a valid trailing path parameter, which it
        // uses to determine whether the endpoint is a single resource or a
        // collection. Solving that might be a nice-to-have, but adding special
        // cases there does not seem appropriate either.
        //
        // TODO: The right solution to this might be to make some rules take
        // precedence over others with a priority score. If a higher scored rule
        // fails, do not bother showing the lower-scored rules?
        expect.objectContaining({
          error: "Could not find a partial match in query parameters",
        }),
      ]),
    );
    expect(results).toMatchSnapshot();
  });

  it("passes valid bulk POST operation", async () => {
    const results = await snapshotScenario(
      undefined,
      "000-batch-post.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "experimental",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it("passes valid meta with free-form sub-properties", async () => {
    const results = await snapshotScenario(
      undefined,
      "000-baseline-meta.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "experimental",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("passes new valid singleton", async () => {
    const results = await snapshotScenario(
      undefined,
      "001-singleton.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "experimental",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("fails new invalid singleton", async () => {
    const results = await snapshotScenario(
      undefined,
      "001-fail-singleton-get-201.yaml",
      resourceDate("thing", "2021-11-10"),
      {
        changeDate: "2021-11-11",
        changeResource: "thing",
        changeVersion: {
          date: "2021-11-10",
          stability: "experimental",
        },
        resourceVersions: {},
      },
    );
    expect(results.every((result) => result.passed)).toBe(false);
  });

  const rootOfRepo = path.resolve(path.join(__dirname, "../../../../../"));

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
