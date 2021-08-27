const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules();
});

it('fails on component case violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('hello-world.fail.yaml'));
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
        path: ['components', 'parameters', 'limit'],
      }),
      expect.objectContaining({
        code: 'component-names-pascal-case',
        path: ['components', 'parameters', 'starting_after'],
      }),
      expect.objectContaining({
        code: 'component-response-names',
        path: ['components', 'responses', 'bad_things'],
      }),
    ]),
  );
});
