const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('naming.yaml');
});

it('fails on snake case violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/pathCasing.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'paths-snake-case',
        message: `Path elements were not snake case: HelloWorld`,
      }),
      expect.objectContaining({
        code: 'paths-snake-case',
        message: `Path elements were not snake case: helloWorld`,
      }),
      expect.objectContaining({
        code: 'paths-snake-case',
        message: `Path elements were not snake case: hello-world`,
      }),
      expect.objectContaining({
        code: 'paths-snake-case',
        message: `Path elements were not snake case: HELLO-WORLD`,
      }),
      expect.objectContaining({
        code: 'paths-snake-case',
        message: `Path elements were not snake case: HELLO_WORLD`,
      }),
    ]),
  );
});
