const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('jsonapi.yaml');
});

it('fails on no enum or examples fields', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(
    loadSpec('fixtures/compoundDocuments.fail.yaml'),
  );
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'jsonapi-no-compound-documents',
        message: 'Compound documents are not allowed',
        path: [
          'paths',
          '/orgs/{org_id}/returns_array',
          'get',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
          'included',
        ],
      }),
    ]),
  );
});
