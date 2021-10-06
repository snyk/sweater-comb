const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('apinext.yaml');
});

it('fails on no enum or examples fields', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/noExamples.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'apinext-operation-response-array-examples',
        message:
          'Responses must have an enum or examples field and be non-empty',
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
          'data',
          'items',
          'properties',
          'attributes',
          'properties',
          'issueType',
        ],
      }),
      expect.objectContaining({
        code: 'apinext-operation-response-single-examples',
        message:
          'Responses must have an enum or examples field and be non-empty',
        path: [
          'paths',
          '/orgs/{org_id}/returns_single',
          'get',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
          'data',
          'properties',
          'attributes',
          'allOf',
          '1',
          'properties',
          'fingerprint',
        ],
      }),
    ]),
  );
});
