import { SnykApiCheckDsl, SynkApiCheckContext } from './dsl';
import { ApiCheckService, DslConstructorInput } from '@useoptic/api-checks';
import { IChange, IFact, OpenAPIV3 } from '@useoptic/openapi-utilities';

export function newSnykApiCheckService() {
  const snykRulesService = new ApiCheckService<SynkApiCheckContext>();

  const dslConstructor = (input: DslConstructorInput<SynkApiCheckContext>) => {
    return new SnykApiCheckDsl(
      input.nextFacts,
      input.changelog,
      input.nextJsonLike,
      input.context,
    );
  };

  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require('./rulesets/operations').rules,
  );
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require('./rulesets/headers').rules,
  );
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require('./rulesets/properties').rules,
  );

  return snykRulesService;
}
