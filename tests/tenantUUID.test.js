const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('apinext.yaml');
});

it('fails on tenant UUID violation', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/tenantUUID.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'openapi-route-tenant-uuids',
        message: `APIs must use UUIDs where org or group tenants are specified`,
      }),
    ]),
  );
});
