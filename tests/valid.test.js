const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec, specFactory } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules();
});

it('passes with empty spec', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const spec = specFactory();

  const result = await spectral.run(spec);

  expect(result).toHaveLength(0);
});

it('passes with valid spec', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/valid.yaml'));
  expect(result).toHaveLength(0);
});
