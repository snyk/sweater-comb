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
        code: 'parameter-names-camel-case',
        path: [
          'paths',
          '/examples/hello_world/HelloWorld/hello-world/{hello-id}',
          'get',
          'parameters',
          '4',
          'name',
        ],
      }),
    ]),
  );
});

it('passes with camel case params', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('hello-world.yaml'));
  expect(result).toHaveLength(0);
});
