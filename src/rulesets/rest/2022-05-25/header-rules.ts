import { ResponseRule, RuleError, Ruleset } from "@useoptic/rulesets-base";
import { paramCase } from "change-case";
import { links } from "../../../docs";

const headerNameCase = new ResponseRule({
  name: "header case",
  docsLink: links.standards.headers.case,
  rule: (responseAssertions) => {
    const parameterTest = (parameter) => {
      if (paramCase(parameter.value.name) !== parameter.value.name) {
        throw new RuleError({
          message: `${parameter.value.name} is not kebab-case`,
        });
      }
    };
    responseAssertions.header.added("be kebab-case", parameterTest);
    responseAssertions.header.changed("be kebab-case", (before, after) =>
      parameterTest(after),
    );
  },
});

const standardHeaders = new ResponseRule({
  name: "standard headers",
  docsLink: links.versioning.responseHeaders,
  matches: (response, ruleContext) =>
    !ruleContext.operation.path.startsWith("/openapi"),
  rule: (responseAssertions) => {
    const requiredHeaders = [
      "snyk-request-id",
      "deprecation",
      "snyk-version-lifecycle-stage",
      "snyk-version-requested",
      "snyk-version-served",
      "sunset",
    ];
    for (const headerName of requiredHeaders) {
      responseAssertions.requirement.hasResponseHeaderMatching(headerName, {});
    }
  },
});

export const responseHeaderRules = new Ruleset({
  name: "response header rules",
  rules: [headerNameCase, standardHeaders],
});
