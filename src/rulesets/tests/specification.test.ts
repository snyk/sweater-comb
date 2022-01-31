import { rules } from "../specification";
import { SynkApiCheckContext } from "../../dsl";

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

describe("orgOrGroupTenant", () => {
  const baseForSpecificationTests = {
    openapi: "3.0.1",
    paths: {
    },
    info: { version: "0.0.0", title: "OpenAPI" },
  };

  it.each`
    valid    | path
    ${false} | ${''}
    ${false} | ${'/thing'}
    ${false} | ${'/org/{org_id}'}
    ${false} | ${'/group/{group_id}'}
    ${true}  | ${'/orgs'}
    ${false} | ${'/orgs/thing'}
    ${true}  | ${'/orgs/{org_id}/thing'}
    ${true}  | ${'/groups'}
    ${false} | ${'/groups/thing'}
    ${true}  | ${'/groups/{group_id}/thing'}
  `(`path '$path' is valid: $valid`, async ({valid, path}) => {
    const result = await compare(baseForSpecificationTests)
      .to((spec) => {
        spec.paths![path] = {};
        return spec;
      })
      .withRule(rules.orgOrGroupTenant, emptyContext);

    const passed = result.results[0].passed;
    valid
      ? expect(passed).toBeTruthy()
      : expect(passed).toBeFalsy();

    expect(result).toMatchSnapshot();
  });

  it.each(['org', 'group'])
  ("fails with both valid and invalid %s tenants", async (tenantType) => {
    const result = await compare(baseForSpecificationTests)
        .to((spec) => {
          spec.paths![`/${tenantType}s/{${tenantType}_id}/thing`] = {};
          spec.paths!["/bad-tenant"] = {};
          return spec;
        })
        .withRule(rules.orgOrGroupTenant, emptyContext);

    expect(result.results[0].passed).toBeFalsy();
    expect(result).toMatchSnapshot();
  });
});
