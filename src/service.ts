import { SnykApiCheckDsl, SynkApiCheckContext } from "./dsl";
import { ApiCheckService, DslConstructorInput } from "@useoptic/api-checks";
import { oas } from "@stoplight/spectral-rulesets";

export function newSnykApiCheckService() {
  const snykRulesService = new ApiCheckService<SynkApiCheckContext>(
    (context) => {
      return new Date(context.changeDate);
    },
  );

  const dslConstructor = (input: DslConstructorInput<SynkApiCheckContext>) => {
    return new SnykApiCheckDsl(
      input.nextFacts,
      input.changelog,
      input.currentJsonLike,
      input.nextJsonLike,
      input.context,
    );
  };

  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require("./rulesets/operations").rules,
  );
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require("./rulesets/headers").rules,
  );
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require("./rulesets/properties").rules,
  );
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require("./rulesets/api-lifeycle").rules,
  );
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require("./rulesets/specification").rules,
  );

  snykRulesService.useSpectralRuleset({
    extends: [[oas, "all"]],
    rules: {
      "openapi-tags": "off",
      "operation-tags": "off",
      "info-contact": "off",
      "info-description": "off",
      "info-license": "off",
      "license-url": "off",
      "oas3-unused-component": "off",
    },
  });

  return snykRulesService;
}
