import {
  Spectral,
  RulesetDefinition as SpectralRulesetDefinition,
} from "@stoplight/spectral-core";
import { oas } from "@stoplight/spectral-rulesets";
import { SpectralRule } from "@useoptic/rulesets-base";

const spectral = new Spectral();
spectral.setRuleset({
  extends: [[oas as SpectralRulesetDefinition, "all"]],
  rules: {
    "openapi-tags": "off",
    "operation-tags": "off",
    "info-contact": "off",
    "info-description": "off",
    "info-license": "off",
    "license-url": "off",
    "oas3-unused-component": "off",
    "operation-success-response": "error",
    "operation-operationId-unique": "error",
    "operation-parameters": "error",
    "operation-tag-defined": "error",
    "path-params": "error",
    "contact-properties": "error",
    "duplicated-entry-in-enum": "error",
    "no-eval-in-markdown": "error",
    "no-script-tags-in-markdown": "error",
    "openapi-tags-alphabetical": "error",
    "openapi-tags-uniqueness": "error",
    "operation-description": "error",
    "operation-operationId": "error",
    "operation-operationId-valid-in-url": "error",
    "operation-singular-tag": "error",
    "path-declarations-must-exist": "error",
    "path-keys-no-trailing-slash": "error",
    "path-not-include-query": "error",
    "tag-description": "error",
    "no-$ref-siblings": "error",
    "typed-enum": "error",
    "oas3-api-servers": "error",
    "oas3-examples-value-or-externalValue": "error",
    "oas3-operation-security-defined": "error",
    "oas3-parameter-description": "error",
    "oas3-server-not-example.com": "error",
    "oas3-server-trailing-slash": "error",

    // Spectral false-positives on oas3-valid-*-example with discriminators,
    // downgrading these to "warn".
    //
    // Spectral open issues on this:
    // https://github.com/stoplightio/spectral/issues/2528
    // https://github.com/stoplightio/spectral/issues/2509
    //
    // Example spec which triggers the false-positive:
    // https://github.com/snyk/issue-policies/pull/968
    "oas3-valid-media-example": "warn",
    "oas3-valid-schema-example": "warn",

    "oas3-schema": "error",
  },
});

export const spectralRuleset = new SpectralRule({
  name: "spectral-rules",
  spectral: spectral,
});
