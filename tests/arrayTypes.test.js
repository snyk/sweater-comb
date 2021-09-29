const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('spec.yaml');
});

it('fails on array having no type rule', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/arrayTypes.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'openapi-arrays-types',
        message: 'Array items must have a "type" field.',
        path: [
          'paths',
          '/groups/{group_id}/issues',
          'get',
          'parameters',
          '2',
          'schema',
          'items',
        ],
      }),
    ]),
  );
});
