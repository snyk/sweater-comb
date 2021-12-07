import { SnykApiCheckDsl } from "../dsl";
import { expect } from "chai";
import { links } from "../docs";

export const rules = {
  example: ({ checkApiContext, responses }: SnykApiCheckDsl) => {
    checkApiContext.must(
      "lifeycle rules have to be followed",
      (context, docs) => {
        docs.includeDocsLink(links.versioning.main);
        context.changeVersion.date;
      },
    );
  },

  stabilityRequirement: ({ stability }: SnykApiCheckDsl) => {
    stability.must(
      "be provided for every resource document",
      (before, after, context, docs) => {
        docs.includeDocsLink(links.versioning.stabilityLevels);
        const allowed = ["wip", "experimental", "beta", "ga"];
        const wasValid = allowed.includes(after || "");

        expect(wasValid, `${after} must be one of allowed values ${allowed}`).to
          .be.ok;
      },
    );
  },

  allowedStabilityTransitions: ({ stability }: SnykApiCheckDsl) => {
    stability.must(
      "not change unless it was wip",
      (before, after, context, docs) => {
        docs.includeDocsLink(links.versioning.promotingStability);
        if (!before && !after) return;
        if (before === "wip") return;
        expect(before).to.equal(after);
      },
    );
  },
};
