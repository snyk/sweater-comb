import { buildNewResourceSpec } from "../templates/new-resource-spec";
import { addCreateOperationTemplate } from "../templates/operations/create";
import { factsToChangelog, OpenAPIV3 } from "@useoptic/openapi-utilities";
import { newSnykApiCheckService } from "../../service";
import { SynkApiCheckContext } from "../../dsl";
import { parseOpenAPIFromMemory } from "@useoptic/openapi-io";
// import { parseOpenAPIFromMemory } from "@useoptic/openapi-io";

describe("workflow templates", () => {
  describe("operations", () => {
    describe("create", () => {
      it("creates a valid spec", async () => {
        const baseSpec = resourceSpecFactory();
        let updatedSpec: OpenAPIV3.Document = JSON.parse(
          JSON.stringify(baseSpec),
        );
        addCreateOperationTemplate(updatedSpec, {
          collectionPath: "/orgs/{org_id}/users/{user_id}",
          titleResourceName: "User",
          resourceName: "user",
        });
        const results = await check(baseSpec, updatedSpec);
        expect(results.filter((r) => !r.passed).length).toBe(0);
        expect(results).toMatchSnapshot();
      });
    });
  });
});

function resourceSpecFactory() {
  return buildNewResourceSpec("User");
}

const context: SynkApiCheckContext = {
  changeDate: "2021-11-11",
  changeResource: "user",
  changeVersion: {
    date: "2021-11-10",
    stability: "beta",
  },
  resourceVersions: {},
};

async function check(from: OpenAPIV3.Document, to: OpenAPIV3.Document) {
  const checkService = newSnykApiCheckService();
  const { jsonLike: parsedFrom } = await parseOpenAPIFromMemory(from);
  const { jsonLike: parsedTo } = await parseOpenAPIFromMemory(to);
  const { currentFacts, nextFacts } = checkService.generateFacts(
    parsedFrom,
    parsedTo,
  );
  const checkResults = await checkService.runRulesWithFacts({
    context,
    nextFacts,
    currentFacts,
    changelog: factsToChangelog(currentFacts, nextFacts),
    nextJsonLike: to,
    currentJsonLike: from,
  });
  return checkResults;
}
