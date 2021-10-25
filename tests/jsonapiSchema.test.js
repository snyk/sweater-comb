const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, loadSpec, getAllErrors } = require('./utils');

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MyService',
    version: '3.0.0',
  },
  servers: [],
  components: {
    headers: {},
    parameters: {},
    responses: {},
    schemas: {},
  },
  paths: {},
};

describe('JSON API Schema', () => {
  let spectral;
  let rules;
  let spec;

  beforeAll(async () => {
    rules = await loadRules('jsonapi.yaml');
    spectral = new Spectral();
    spectral.setRuleset(rules);
    spec = loadSpec('fixtures/jsonapiSchema.fail.yaml');
  });

  describe('Schema rules', () => {
    let result;

    it('fails on version schema rules', async () => {
      // Act
      result = await spectral.run(spec);

      // Assert
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
        ]),
      );
    });

    it('fails if 200 patch response contains invalid properties', async () => {
      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
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
        ]),
      );
    });

    it('fails if 200 patch response does not have meta property', async () => {
      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
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
        ]),
      );
    });

    it('fails if 204 patch response has content', async () => {
      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-patch-response-204-schema',
            message: '"content" property must be falsy',
          }),
        ]),
      );
    });

    it('fails if delete response does not use 200 or 204 status code', async () => {
      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-delete-response-statuses',
            message: 'Delete endpoints can only use 200 or 204 status codes',
          }),
        ]),
      );
    });

    it('fails if 4xx is not 400,401,403,404,409, or 429', async () => {
      const result = await spectral.run(spec);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-4xx-response-codes',
            message:
              'Only 400, 401, 403, 404, 409, and 429 status codes can be returned in the 4xx.',
          }),
        ]),
      );
    });

    it('fails if 200 delete response does not have meta', async () => {
      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-delete-response-200',
            message: '"properties" property must have required property "meta"',
          }),
        ]),
      );
    });

    it('fails if 204 delete response has content', async () => {
      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-delete-response-204',
            message: '"content" property must be falsy',
          }),
        ]),
      );
    });
  });

  describe('Schema Rules', () => {
    let result;

    it('fails if a non-204 response has no content', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/no_content': {
          get: {
            responses: {
              200: {},
              201: {},
              204: {},
            },
          },
        },
      };

      // Act
      result = await spectral.run(spec);

      // Assert
      const errorArray = getAllErrors(result, 'jsonapi-content-non-204');
      expect(errorArray).toHaveLength(2);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-content-non-204',
            message: 'Responses from non-204 statuses must have content',
          }),
        ]),
      );
    });
  });

  describe('Self linking rules', () => {
    it('fails if a GET 200 response does not have a top-level self link', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/example': {
          get: {
            responses: {
              200: {
                content: {
                  'application/vnd.api+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {},
                        jsonapi: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      const errorArray = getAllErrors(result, 'jsonapi-self-links-get-patch');
      expect(errorArray).toHaveLength(1);
    });

    it('fails if a PATCH 200 response does not have a top-level self link', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/example': {
          patch: {
            parameters: [],
            responses: {
              200: {
                content: {
                  'application/vnd.api+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        meta: {},
                      },
                      required: ['meta'],
                      additionalProperties: false,
                    },
                  },
                },
              },
            },
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      const errorArray = getAllErrors(result, 'jsonapi-self-links-get-patch');
      expect(errorArray).toHaveLength(1);
    });

    it('fails if a POST 201 response does not have a top-level self link', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/example': {
          post: {
            parameters: [],
            responses: {
              201: {
                content: {
                  'application/vnd.api+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        jsonapi: {},
                        data: {},
                      },
                      required: ['jsonapi', 'data'],
                      additionalProperties: false,
                    },
                  },
                },
              },
            },
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      const errorArray = getAllErrors(result, 'jsonapi-self-links-post');
      expect(errorArray).toHaveLength(1);
    });
  });

  describe('Collection Rules', () => {
    it('fails if collection requests do not include pagination parameters', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/collection_pagination_parameters': {
          get: {
            parameters: [
              {
                description:
                  'Return the page of results immediately after this cursor',
                in: 'query',
                name: 'starting_after',
                schema: {
                  type: 'string',
                },
              },
            ],
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-pagination-collection-parameters',
            message: 'Collection requests must include pagination parameters',
          }),
        ]),
      );
    });

    it('fails if collection responses do not include pagination links', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/collection_pagination_links': {
          get: {
            responses: {
              200: {
                content: {
                  'application/vnd.api+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        jsonapi: {
                          $ref: '#/components/schemas/JsonApi',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-pagination-collection-links',
            message:
              'Responses for collection requests must include pagination links',
          }),
        ]),
      );
    });

    it('fails if non-GET for collections requests include pagination parameters', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.components.parameters = {
        StartingAfter: {
          description:
            'Return the page of results immediately after this cursor',
          in: 'query',
          name: 'starting_after',
          schema: {
            type: 'string',
          },
        },
      };
      spec.paths = {
        '/org/{org_id}/non_get_pagination_parameters': {
          post: {
            parameters: [
              {
                $ref: '#/components/parameters/Version',
              },
              {
                $ref: '#/components/parameters/StartingAfter',
              },
            ],
          },
          patch: {
            parameters: [
              {
                $ref: '#/components/parameters/Version',
              },
              {
                $ref: '#/components/parameters/StartingAfter',
              },
            ],
          },
          delete: {
            parameters: [
              {
                $ref: '#/components/parameters/Version',
              },
              {
                $ref: '#/components/parameters/StartingAfter',
              },
            ],
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'jsonapi-no-pagination-parameters',
            message: 'Non-GET requests should not allow pagination parameters',
          }),
        ]),
      );
    });
  });

  describe('Relationships', () => {
    it('passes with correct relationship schema', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/relationship': {
          get: {
            responses: {
              200: {
                content: {
                  'application/vnd.api+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            type: {
                              type: 'string',
                            },
                            id: {
                              type: 'string',
                            },
                            attributes: {},
                            relationships: {
                              type: 'object',
                              additionalProperties: {
                                type: 'object',
                                properties: {
                                  data: {
                                    properties: {
                                      type: {
                                        type: 'string',
                                      },
                                      id: {
                                        type: 'string',
                                        format: 'uuid',
                                      },
                                    },
                                    required: ['type', 'id'],
                                  },
                                  links: {
                                    type: 'object',
                                    properties: {
                                      related: {
                                        type: 'string',
                                      },
                                    },
                                  },
                                },
                                required: ['data'],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      const errors = getAllErrors(
        result,
        'jsonapi-response-relationship-schema',
      );
      expect(errors).toHaveLength(0);
    });

    it('fails on incorrect relationship schema', async () => {
      // Arrange
      const spec = {
        ...openApiDocument,
      };
      spec.paths = {
        '/org/{org_id}/relationship': {
          get: {
            responses: {
              200: {
                content: {
                  'application/vnd.api+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            type: {
                              type: 'string',
                            },
                            id: {
                              type: 'string',
                            },
                            attributes: {},
                            relationships: {
                              type: 'object',
                              additionalProperties: {
                                type: 'object',
                                properties: {
                                  data: {
                                    properties: {
                                      type: {
                                        type: 'string',
                                      },
                                      id: {
                                        type: 'string',
                                        format: 'uuid',
                                      },
                                    },
                                    required: ['type', 'id'],
                                  },
                                },
                                required: ['data'],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      // Act
      const result = await spectral.run(spec);

      // Assert
      const errors = getAllErrors(
        result,
        'jsonapi-response-relationship-schema',
      );
      expect(errors).toHaveLength(1);
    });
  });
});
