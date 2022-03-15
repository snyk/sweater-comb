import { buildNewResourceSpec } from "../templates/new-resource-spec";
import { addCreateOperationTemplate } from "../templates/operations/create";
import { parseSpecVersion, specFromInputToResults } from "@useoptic/api-checks";
import {
  defaultEmptySpec,
  factsToChangelog,
  OpenAPIV3,
} from "@useoptic/openapi-utilities";
import { newSnykApiCheckService } from "../../service";
import { SynkApiCheckContext } from "../../dsl";

describe("workflow templates", () => {
  describe("operations", () => {
    describe("create", () => {
      it("creates a valid spec", async () => {
        const baseSpec = resourceSpecFactory();
        let updatedSpec: OpenAPIV3.Document = JSON.parse(
          JSON.stringify(baseSpec),
        );
        addCreateOperationTemplate(updatedSpec, {
          collectionPath: "/users/{user_id}",
          titleResourceName: "User",
          resourceName: "user",
        });
        const results = await check(baseSpec, updatedSpec);
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
  const { currentFacts, nextFacts } = checkService.generateFacts(from, to);
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
