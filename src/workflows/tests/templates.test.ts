import { buildNewResourceSpec } from "../templates/new-resource-spec";
import { addCreateOperationTemplate } from "../templates/operations/create";
import { OpenAPIV3 } from "@useoptic/openapi-utilities";
import { loadSpecFromFile } from "@useoptic/openapi-io";
import { RuleRunner, TestHelpers } from "@useoptic/rulesets-base";
import { addUpdateOperationTemplate } from "../templates/operations/update";
import { addDeleteOperationTemplate } from "../templates/operations/delete";
import { addGetOperationTemplate } from "../templates/operations/get";
import { addListOperationTemplate } from "../templates/operations/list";
import { resourceRules as rules } from "../../rulesets/rest/2022-05-25";
import * as fs from "fs";
import * as path from "path";

describe("workflow templates", () => {
  describe("operations", () => {
    describe("create", () => {
      checkTemplate(addCreateOperationTemplate);
    });
    describe("delete", () => {
      checkTemplate(addDeleteOperationTemplate);
    });
    describe("get", () => {
      checkTemplate(addGetOperationTemplate);
    });
    describe("list", () => {
      checkTemplate(addListOperationTemplate);
    });
    describe("update", () => {
      checkTemplate(addUpdateOperationTemplate);
    });
  });
});

jest.setTimeout(20000);

function checkTemplate(template) {
  it("creates a valid spec", async () => {
    const baseSpec = buildNewResourceSpec("User", "User", "Users");
    const updatedSpec: OpenAPIV3.Document = JSON.parse(
      JSON.stringify(baseSpec),
    );
    template(updatedSpec, {
      pluralResourceName: "users",
    });
    expect(updatedSpec.servers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://api.snyk.io/rest" }),
      ]),
    );
    const results = await check(baseSpec, updatedSpec);
    const failedChecks = results.filter((r) => !r.passed);
    expect(failedChecks.length).toBe(0);
  });
}

const context = {
  changeDate: "2021-11-11",
  changeResource: "user",
  changeVersion: {
    date: "2021-11-10",
    stability: "beta",
  },
  resourceVersions: {},
};

async function check(from: OpenAPIV3.Document, to: OpenAPIV3.Document) {
  const ruleRunner = new RuleRunner(rules);
  const tmp = fs.mkdtempSync("workflow-check");
  try {
    const fromFile = path.join(tmp, "from.yaml");
    const toFile = path.join(tmp, "to.yaml");
    fs.writeFileSync(fromFile, JSON.stringify(from));
    fs.writeFileSync(toFile, JSON.stringify(to));
    const { flattened: parsedFrom } = await loadSpecFromFile(fromFile);
    const { flattened: parsedTo } = await loadSpecFromFile(toFile);
    if (!parsedFrom || !parsedTo) {
      throw new Error("failed to read OpenAPI files");
    }
    const ruleInputs = {
      ...TestHelpers.createRuleInputs(parsedFrom, parsedTo),
      context,
    };
    const results = ruleRunner.runRulesWithFacts(ruleInputs);
    return results;
  } finally {
    fs.rmdirSync(tmp, { recursive: true });
  }
}
