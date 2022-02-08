import { rules } from "../jsonapi";
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

describe("json-api", () => {
  const baseForOperationIdTests = {
    openapi: "3.0.1",
    paths: {
      "/example": {
        get: {
          responses: {
            "200": {
              description: "",
            },
          },
        },
      },
    },
    info: { version: "0.0.0", title: "OpenAPI" },
  };

  it("requires responses to not be empty", async () => {
    const result = await compare(baseForOperationIdTests)
      .to((a) => a)
      .withRule(rules.responseData, emptyContext);

    expect(result.results[0].passed).toBeFalsy();
    expect(result).toMatchSnapshot();
  });
});
