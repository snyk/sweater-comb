import { RuleError, Ruleset, SpecificationRule } from "@useoptic/rulesets-base";
import { links } from "../../../docs";
import { stabilityKey } from "./constants";

const stabilityRequirement = new SpecificationRule({
  name: "resource stability",
  docsLink: links.versioning.stabilityLevels,
  matches: (specification, rulesContext) =>
    rulesContext.specification.change !== "removed",
  rule: (specificationAssertions) => {
    specificationAssertions.requirement(
      "be provided for every resource document",
      (specification) => {
        const stability: string | undefined = specification.value[stabilityKey];
        const allowed = ["wip", "experimental", "beta", "ga"];
        if (!stability || !allowed.includes(stability)) {
          throw new RuleError({
            message: `${stability} must be one of allowed values ${allowed.join(
              ", ",
            )}`,
          });
        }
      },
    );
  },
});

const stabilityTransitions = new SpecificationRule({
  name: "resource stability transitions",
  docsLink: links.versioning.promotingStability,
  rule: (specificationAssertions) => {
    specificationAssertions.changed(
      "not change unless it was wip",
      (before, after) => {
        const beforeStability: string | undefined = before.value[stabilityKey];
        const afterStability: string | undefined = after.value[stabilityKey];
        // When there is no `before`, it means it's a new file. Any stability is allowed.
        // When there is no `after`, it means it's been deleted and sunset rules should apply in another rule.
        if (!beforeStability || !afterStability) return;
        // A resource can go from wip to anything, so no need to check.
        if (beforeStability === "wip") return;

        if (beforeStability !== afterStability) {
          throw new RuleError({
            message: `stability transition from '${before}' to '${after}' not allowed`,
          });
        }
      },
    );
  },
});

const followSunsetRules = new SpecificationRule({
  name: "sunset rules",
  matches: (specification, rulesContext) => {
    return (
      !(
        specification.value[stabilityKey] === "wip" ||
        specification.value[stabilityKey] === "experimental"
      ) && rulesContext.specification.change === "removed"
    );
  },
  rule: (specificationAssertions, rulesContext) => {
    specificationAssertions.requirement("follow sunset rules", () => {
      const {
        resourceVersions,
        changeResource: resourceName,
        changeVersion: { date, stability },
        changeDate,
      } = rulesContext.custom;

      const deprecatedBy =
        resourceVersions?.[resourceName]?.[date]?.[stability]?.deprecatedBy;

      if (!deprecatedBy) {
        throw new RuleError({
          message: `expected ${resourceName} to be deprecated before removing`,
        });
      }

      const contextDate = new Date(changeDate);
      const resourceDate = new Date(date);

      const diffDays =
        (contextDate.getTime() - resourceDate.getTime()) /
        (1000 * 60 * 60 * 24);

      // Number of days required before a resource can be removed
      const sunsetSchedule = {
        beta: 90,
        ga: 180,
      };
      const requiredDays = sunsetSchedule[stability];

      if (!requiredDays) {
        throw new RuleError({
          message: `unexpected stability ${stability} in ${resourceName}`,
        });
      }
      if (diffDays < requiredDays) {
        throw new RuleError({
          message: `expected ${stability} resource ${resourceName} to be deprecated ${requiredDays} days`,
        });
      }
    });
  },
});

export const lifecycleRuleset = new Ruleset({
  name: "api lifecycle ruleset",
  rules: [stabilityRequirement, stabilityTransitions, followSunsetRules],
});
