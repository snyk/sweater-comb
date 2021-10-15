const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('apinext.yaml');
});

it('fails on invalid tags', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('fixtures/tags.fail.yaml'));

  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'apinext-tags-name-description',
        message: 'Tags must have a name and description',
      }),
    ]),
  );
});
