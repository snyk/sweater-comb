const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules();
});

it('fails on version response header rules', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('hello-world.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'version-response-deprecation',
        path: [
          'paths',
          '/goof/no-version',
          'get',
          'responses',
          '200',
          'headers',
        ],
      }),
      expect.objectContaining({
        code: 'version-response-lifecycle-stage',
        path: [
          'paths',
          '/goof/no-version',
          'get',
          'responses',
          '200',
          'headers',
        ],
      }),
      expect.objectContaining({
        code: 'version-response-requested',
        path: [
          'paths',
          '/goof/no-version',
          'get',
          'responses',
          '200',
          'headers',
        ],
      }),
      expect.objectContaining({
        code: 'version-response-served',
        path: [
          'paths',
          '/goof/no-version',
          'get',
          'responses',
          '200',
          'headers',
        ],
      }),
      expect.objectContaining({
        code: 'version-response-sunset',
        path: [
          'paths',
          '/goof/no-version',
          'get',
          'responses',
          '200',
          'headers',
        ],
      }),
    ]),
  );
});

it('fails on version request parameter rules', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('hello-world.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'version-request',
        path: ['paths', '/goof/no-version', 'get', 'parameters'],
      }),
    ]),
  );
});

it('fails on no request parameters or response headers', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(loadSpec('hello-world.fail.yaml'));
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'requests-declare-parameters',
        path: ['paths', '/goof/no-params-no-headers', 'get'],
      }),
      expect.objectContaining({
        code: 'responses-declare-headers',
        path: [
          'paths',
          '/goof/no-params-no-headers',
          'get',
          'responses',
          '200',
        ],
      }),
    ]),
  );
});
