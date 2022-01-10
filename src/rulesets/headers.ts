import { SnykApiCheckDsl } from "../dsl";
import { expect } from "chai";
import { paramCase } from "change-case";
import { links } from "../docs";

export const rules = {
  headerNameCase: ({ responses }: SnykApiCheckDsl) => {
    responses.headers.requirementOnChange
      .attributes("name")
      .must("be kebab-case", ({ name }, context, docs) => {
        docs.includeDocsLink(links.standards.headers.case);
        expect(paramCase(name)).to.equal(name);
      });
  },
  responseHeaders: ({ responses }: SnykApiCheckDsl) => {
    responses.requirement.must(
      "have all headers",
      (response, context, docs, specItem) => {
        docs.includeDocsLink(links.versioning.responseHeaders);
        const requiredHeaders = [
          "snyk-request-id",
          "deprecation",
          "snyk-version-lifecycle-stage",
          "snyk-version-requested",
          "snyk-version-served",
          "sunset",
        ];
        const specHeaders = Object.keys(specItem.headers || {});

        // Note: this allows for including headers that aren't required
        for (const requiredHeader of requiredHeaders) {
          expect(specHeaders).to.include(requiredHeader);
        }
      },
    );
  },
};
