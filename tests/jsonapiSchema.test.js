const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

let rules;

beforeAll(async () => {
  rules = await loadRules('jsonapi.yaml');
});

it('fails on version schema rules', async () => {
  const spectral = new Spectral();
  spectral.setRuleset(rules);
  const result = await spectral.run(
    loadSpec('fixtures/jsonapiSchema.fail.yaml'),
  );
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'jsonapi-get-post-response-data-schema',
        message: '"properties" property must have required property "id"',
        path: [
          'paths',
          '/goof/badJsonApi/missingDataId',
          'get',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
          'data',
          'properties',
        ],
      }),
      expect.objectContaining({
        code: 'jsonapi-get-post-response-data-schema',
        message: '"data" property must have required property "properties"',
        path: [
          'paths',
          '/goof/badJsonApi/dataIdNotUuid',
          'get',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
          'data',
        ],
      }),
      expect.objectContaining({
        code: 'jsonapi-get-post-response-data-schema',
        message: '"properties.data" property must exist',
        path: [
          'paths',
          '/goof/badJsonApi/dataMissingType',
          'get',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
        ],
      }),
      expect.objectContaining({
        code: 'jsonapi-response-jsonapi',
        message: 'JSON:API response schema requires jsonapi property',
        path: [
          'paths',
          '/goof/badJsonApi/dataMissingType',
          'get',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
        ],
      }),
      expect.objectContaining({
        code: 'jsonapi-get-post-response-data',
        message: 'JSON:API response schema requires data property',
        path: [
          'paths',
          '/goof/badJsonApi/dataMissingType',
          'get',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
        ],
      }),
    ]),
  );
});
