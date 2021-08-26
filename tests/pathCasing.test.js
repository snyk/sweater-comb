const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules();
});

it('fails on camel case violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(await loadSpec('hello-world.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'paths-are-camel-cased',
        message: `Path elements in "/examples/hello_world/HelloWorld/hello-world/{hello-id}" are not camelCased: hello_world, HelloWorld, hello-world`,
      }),
    ]),
  );
});

it('passes with camel case paths', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(await loadSpec('hello-world.yaml'));
  expect(result).toHaveLength(0);
});
