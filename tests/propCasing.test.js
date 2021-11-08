const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('naming.yaml');
});

it('fails on snake case violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/propCasing.fail.yaml'));
  expect(result).toHaveLength(8);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'property-names-snake-case',
        path: [
          'components',
          'schemas',
          'HelloWorld',
          'properties',
          'attributes',
          'properties',
          'deprecatedField',
        ],
      }),
      expect.objectContaining({
        code: 'property-names-snake-case',
        path: [
          'components',
          'schemas',
          'HelloWorld',
          'properties',
          'attributes',
          'properties',
          'requestSubject',
        ],
      }),
      expect.objectContaining({
        code: 'property-names-snake-case',
        path: [
          'components',
          'schemas',
          'HelloWorld',
          'properties',
          'attributes',
          'properties',
          'requestSubject',
          'properties',
          'clientId',
        ],
      }),
      expect.objectContaining({
        code: 'property-names-snake-case',
        path: [
          'components',
          'schemas',
          'HelloWorld',
          'properties',
          'attributes',
          'properties',
          'requestSubject',
          'properties',
          'publicId',
        ],
      }),
    ]),
  );
});
