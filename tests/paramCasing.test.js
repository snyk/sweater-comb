const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('naming.yaml');
});

it('fails on snake case violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/paramCasing.fail.yaml'));
  expect(result).not.toHaveLength(3);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'parameter-names-snake-case',
        path: ['components', 'parameters', 'EndingBefore', 'name'],
      }),
      expect.objectContaining({
        code: 'parameter-names-snake-case',
        path: ['components', 'parameters', 'StartingAfter', 'name'],
      }),
      expect.objectContaining({
        code: 'parameter-names-snake-case',
        path: [
          'paths',
          '/examples/hello_world/{hello-id}',
          'get',
          'parameters',
          '4',
          'name',
        ],
      }),
    ]),
  );
});
