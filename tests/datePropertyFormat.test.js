const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('apinext.yaml');
});

it('fails on no enum or examples fields', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(
    loadSpec('fixtures/datePropertyFormat.fail.yaml'),
  );
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      // created
      expect.objectContaining({
        code: 'apinext-date-property-formatting',
        message: 'Date-time properties require correct date-time format',
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
          'created',
        ],
      }),
      // updated
      expect.objectContaining({
        code: 'apinext-date-property-formatting',
        message: 'Date-time properties require correct date-time format',
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
          'updated',
        ],
      }),
      // deleted
      expect.objectContaining({
        code: 'apinext-date-property-formatting',
        message: 'Date-time properties require correct date-time format',
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
          'deleted',
        ],
      }),
    ]),
  );
});
