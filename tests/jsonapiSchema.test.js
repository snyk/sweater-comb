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
      expect.objectContaining({
        code: 'jsonapi-post-response-201',
        message:
          'Post responses must respond with a 201 status code on success',
        path: [
          'paths',
          '/goof/bad_post_status_code',
          'post',
          'responses',
          '200',
        ],
      }),

      expect.objectContaining({
        code: 'jsonapi-patch-response-data',
        message: 'JSON:API patch 200 response requires a schema',
        path: [
          'paths',
          '/goof/patch_missing_content',
          'patch',
          'responses',
          '200',
        ],
      }),

      expect.objectContaining({
        code: 'jsonapi-patch-response-200-schema',
        message: 'Property "anotherField" is not expected to be here',
        path: [
          'paths',
          '/goof/patch_no_meta_only',
          'patch',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
        ],
      }),

      expect.objectContaining({
        code: 'jsonapi-patch-response-200-schema',
        message: '"properties" property must have required property "meta"',
        path: [
          'paths',
          '/goof/patch_no_data',
          'patch',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
        ],
      }),

      expect.objectContaining({
        code: 'jsonapi-patch-response-204-schema',
        message: '"content" property must be falsy',
        path: [
          'paths',
          '/goof/patch_no_content',
          'patch',
          'responses',
          '204',
          'content',
        ],
      }),

      expect.objectContaining({
        code: 'jsonapi-delete-response-statuses',
        message: 'Delete endpoints can only use 200 or 204 status codes',
        path: [
          'paths',
          '/goof/delete_invalid_status',
          'delete',
          'responses',
          '203',
        ],
      }),

      expect.objectContaining({
        code: 'jsonapi-delete-response-200',
        message: '"properties" property must have required property "meta"',
        path: [
          'paths',
          '/goof/delete_with_meta',
          'delete',
          'responses',
          '200',
          'content',
          'application/vnd.api+json',
          'schema',
          'properties',
        ],
      }),

      expect.objectContaining({
        code: 'jsonapi-delete-response-204',
        message: '"content" property must be falsy',
        path: [
          'paths',
          '/goof/delete_no_content',
          'delete',
          'responses',
          '204',
          'content',
        ],
      }),
    ]),
  );
});
