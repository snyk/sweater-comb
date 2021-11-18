import { rules } from "../api-lifeycle";
import { SnykApiCheckDsl, SynkApiCheckContext } from "../../dsl";
import { createSnykTestFixture } from "./fixtures";

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

describe("lifecycle", () => {
  // todo: fix copy/paste
  const baseOpenAPI = {
    openapi: "3.0.1",
    paths: {
      "/example": {
        get: {
          responses: {},
        },
      },
    },
    info: { version: "0.0.0", title: "Empty" },
  };

  const withWip = {
    openapi: "3.0.1",
    "x-snyk-api-stability": "wip",
    paths: {
      "/example": {
        get: {
          responses: {},
        },
      },
    },
    info: { version: "0.0.0", title: "Empty" },
  };
  const withGa = {
    openapi: "3.0.1",
    "x-snyk-api-stability": "ga",
    paths: {
      "/example": {
        get: {
          responses: {},
        },
      },
    },
    info: { version: "0.0.0", title: "Empty" },
  };

  describe("stability", () => {
    it("must be provided", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          return spec;
        })
        .withRule(rules.stabilityRequirement, emptyContext);

      expect(result.results.every((i) => i.passed)).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("must be one of the allowed values", async () => {
      const result = await compare(baseOpenAPI)
        .to((spec) => {
          spec["x-snyk-api-stability"] = "published";
          return spec;
        })
        .withRule(rules.stabilityRequirement, emptyContext);

      expect(result.results.every((i) => i.passed)).toBeFalsy();
      expect(result).toMatchSnapshot();
    });

    it("wip can change to another maturity", async () => {
      const result = await compare(withWip)
        .to((spec) => {
          spec["x-snyk-api-stability"] = "beta";
          return spec;
        })
        .withRule(rules.allowedStabilityTransitions, emptyContext);

      expect(result.results.every((i) => i.passed)).toBeTruthy();
      expect(result).toMatchSnapshot();
    });

    it("can not change from any stability but wip", async () => {
      const result = await compare(withGa)
        .to((spec) => {
          spec["x-snyk-api-stability"] = "beta";
          return spec;
        })
        .withRule(rules.allowedStabilityTransitions, emptyContext);

      expect(result.results.every((i) => i.passed)).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });
});
