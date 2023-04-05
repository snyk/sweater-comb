import { responseHeaderRules } from "./header-rules";
import { lifecycleRuleset } from "./lifecycle-rules";
import {
  operationRulesCompiled,
  operationRulesResource,
} from "./operation-rules";
import { propertyRulesCompiled, propertyRulesResource } from "./property-rules";
import { specificationRules } from "./specification-rules";
import {
  statusCodesRules,
  jsonApiContentTypeRule,
  resourceObjectRules,
  paginationRules,
  doNotAllowDeleteOrPostIdForSingleton,
  compoundDocuments,
} from "./json-api-rules";
import { spectralRuleset } from "./spectral";

//
export const resourceRules = [
  responseHeaderRules,
  lifecycleRuleset,
  operationRulesResource,
  propertyRulesResource,
  specificationRules,
  statusCodesRules,
  jsonApiContentTypeRule,
  resourceObjectRules,
  paginationRules,
  doNotAllowDeleteOrPostIdForSingleton,
  compoundDocuments,
  spectralRuleset,
];

export const compiledRules = [
  responseHeaderRules,
  operationRulesCompiled,
  propertyRulesCompiled,
  specificationRules,
  statusCodesRules,
  jsonApiContentTypeRule,
  resourceObjectRules,
  paginationRules,
  doNotAllowDeleteOrPostIdForSingleton,
  compoundDocuments,
  spectralRuleset,
];
