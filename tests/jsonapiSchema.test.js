const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec } = require('./utils');

const openApiDocument = `
info:
  title: Registry
  version: 3.0.0
openapi: 3.0.3

servers:
  - description: Snyk Registry
    url: /api/v3
`;
const rulesetComponents = `
components:
  parameters:
    Version:
      description: The requested version of the endpoint to process the request
      in: query
      name: version
      required: true
      schema:
        type: string
`;

describe('JSON API Schema', () => {
  let spectral;
  let rules;
  let result;

  beforeAll(async () => {
    rules = await loadRules('jsonapi.yaml');
    spectral = new Spectral();
    spectral.setRuleset(rules);
    result = await spectral.run(loadSpec('fixtures/jsonapiSchema.fail.yaml'));
  });

  it('fails on version schema rules', async () => {
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

  describe('Collection Rules', () => {
    let ruleSet = '';
    let validationResults;

    beforeAll(async () => {
      ruleSet = `
${openApiDocument}
${rulesetComponents}
    StartingAfter:
      description: Return the page of results immediately after this cursor
      in: query
      name: starting_after
      schema:
        type: string

paths:
  /org/{org_id}/collection_pagination_parameters:
    get:
      description: 'test'
      operationId: dataCollectionPaginationParameters
      parameters:
        - $ref: '#/components/parameters/Version'
        - description: Return the page of results immediately after this cursor
          in: query
          name: starting_after
          schema:
            type: string

  /org/{org_id}/collection_pagination_links:
    get:
      description: 'test'
      parameters:
        - $ref: '#/components/parameters/Version'
      responses:
        '200':
          content:
            application/vnd.api+json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Project' }
                  jsonapi: { $ref: '#/components/schemas/JsonApi' }

  /org/{org_id}/non_get_pagination_parameters:
    post:
      description: 'test'
      parameters:
        - $ref: '#/components/parameters/Version'
        - $ref: '#/components/parameters/StartingAfter'

    patch:
      description: 'test'
      parameters:
        - $ref: '#/components/parameters/Version'
        - $ref: '#/components/parameters/StartingAfter'

    delete:
      description: 'test'
      parameters:
        - $ref: '#/components/parameters/Version'
        - $ref: '#/components/parameters/StartingAfter'
      `;

      validationResults = await spectral.run(ruleSet);
    });

    it('fails on collection pagination rules', () => {
      expect(validationResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-pagination-collection-parameters',
            message: 'Collection requests must include pagination parameters',
            path: [
              'paths',
              '/org/{org_id}/collection_pagination_parameters',
              'get',
              'parameters',
            ],
          }),

          expect.objectContaining({
            code: 'jsonapi-pagination-collection-links',
            message:
              'Responses for collection requests must include pagination links',
            path: [
              'paths',
              '/org/{org_id}/collection_pagination_links',
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
            code: 'jsonapi-no-pagination-parameters',
            message: 'Non-GET requests should not allow pagination parameters',
            path: [
              'paths',
              '/org/{org_id}/non_get_pagination_parameters',
              'post',
              'parameters',
            ],
          }),
        ]),
      );
    });
  });
});
