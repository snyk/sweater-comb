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
        // When there is no `before`, it means it's a new file. Any stability is allowed.
        // When there is no `after`, it means it's been deleted and sunset rules should apply in another rule.
        if (!before || !after) return;
        // A resource can go from wip to anything, so no need to check.
        if (before === "wip") return;
        expect(before).to.equal(after);
      },
    );
  },
  followSunsetRules: ({ checkApiContext }: SnykApiCheckDsl) => {
    checkApiContext.must("follow sunset rules", (context) => {
      if (!context.wasDeleted) return;
      const deprecatedBy =
        context.resourceVersions?.[context.changeResource]?.[
          context.changeVersion.date
        ]?.[context.changeVersion.stability]?.deprecatedBy;

      // This means the resource was never deprecated
      if (!deprecatedBy) {
        expect.fail(
          `expected ${context.changeResource} to be deprecated before removing`,
        );
        return;
      }

      const { stability } = context.changeVersion;
      const resourceName = context.changeResource;

      // Make sure the sunset schedule is followed now
      const contextDate = new Date(context.changeDate);
      const resourceDate = new Date(context.changeVersion.date);
      const diffDays =
        (contextDate.getTime() - resourceDate.getTime()) /
        (1000 * 60 * 60 * 24);

      // Number of days required before a resource can be removed
      const sunsetSchedule = {
        experimental: 30,
        beta: 90,
        ga: 180,
      };
      const requiredDays = sunsetSchedule[stability];
      if (diffDays < requiredDays) {
        expect(
          diffDays,
          `expected ${stability} resource ${resourceName} to be deprecated ${requiredDays} days`,
        ).to.be.gt(requiredDays);
      }
    });
  },
};
