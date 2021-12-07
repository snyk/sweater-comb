import { SnykApiCheckDsl } from "../dsl";
import { expect } from "chai";

export const rules = {
  example: ({ checkApiContext, responses }: SnykApiCheckDsl) => {
    checkApiContext.must(
      "lifeycle rules have to be followed",
      (context, docs) => {
        docs.includeDocsLink("https://how.we.version/rule");
        context.changeVersion.date;
      },
    );
  },

  stabilityRequirement: ({ stability }: SnykApiCheckDsl) => {
    stability.must(
      "be provided for every resource document",
      (before, after, context, docs) => {
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
        if (!before && !after) return;
        // Allow for creating new resource versions with any stability.
        // No `before` means this is a new resource
        if (!before) return;
        if (before === "wip") return;
        expect(before).to.equal(after);
      },
    );
  },
};
