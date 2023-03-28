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
  },
});

export const spectralRuleset = new SpectralRule({
  spectral,
});
