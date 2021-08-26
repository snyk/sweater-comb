const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules();
});

it('fails on camel case violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('hello-world.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'paths-camel-case',
        message: `Path elements were not camel case: hello_world, HelloWorld, hello-world`,
      }),
    ]),
  );
});

it('passes with camel case paths', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('hello-world.yaml'));
  expect(result).toHaveLength(0);
});
