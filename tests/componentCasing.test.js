const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('naming.yaml');
});

it('fails on component case violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(
    loadSpec('fixtures/componentCasing.fail.yaml'),
  );
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'component-names-pascal-case',
        path: ['components', 'headers', 'RequestIDResponseHeader'],
      }),
      expect.objectContaining({
        code: 'component-names-pascal-case',
        path: ['components', 'parameters', 'ending_before'],
      }),
      expect.objectContaining({
        code: 'component-names-pascal-case',
        path: ['components', 'parameters', 'startingAfter'],
      }),
      expect.objectContaining({
        code: 'component-names-pascal-case',
        path: ['components', 'schemas', 'hello-world'],
      }),
      expect.objectContaining({
        code: 'component-names-pascal-case',
        path: ['components', 'schemas', 'JSON-API'],
      }),
      expect.objectContaining({
        code: 'component-response-names',
        path: ['components', 'responses', 'bad_things'],
      }),
    ]),
  );
});
