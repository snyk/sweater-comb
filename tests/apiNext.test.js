const { Spectral } = require('@stoplight/spectral-core');
const { loadRules, getAllErrors } = require('./utils');

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

  beforeAll(async () => {
    rules = await loadRules('apinext.yaml');
    spectral = new Spectral();
    spectral.setRuleset(rules);
  });

  it('fails on tenant UUID violation', async () => {
    // Arrange
    const spec = {
      ...openApiDocument,
    };
    spec.paths = {
      '/orgs/{org_id}/example': {
        get: {
          parameters: [
            {
              name: 'org_id',
              in: 'path',
              required: true,
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
    const errors = getAllErrors(result, 'apinext-route-tenant-uuids');
    expect(errors).toHaveLength(1);
  });

  it('fails if no org or group tenant exists in the path', async () => {
    // Arrange
    const spec = {
      ...openApiDocument,
    };
    spec.paths = {
      '/goof/example': {
        get: {},
      },
    };

    // Act
    const result = await spectral.run(spec);

    // Assert
    expect(result).not.toHaveLength(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'apinext-paths-tenants',
          message: 'APIs must have an org or group tenant',
        }),
      ]),
    );
  });

  it('fails if no org tenant exists in the path', async () => {
    // Arrange
    const spec = {
      ...openApiDocument,
    };
    spec.paths = {
      '/groups/{group_id]}/example': {
        get: {},
      },
      '/goof/example': {
        get: {},
      },
    };

    // Act
    const result = await spectral.run(spec);

    // Assert
    expect(result).not.toHaveLength(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'apinext-paths-tenants',
          message: 'APIs must have an org or group tenant',
        }),
      ]),
    );
  });

  it('fails if no group tenant exists in the path', async () => {
    // Arrange
    const spec = {
      ...openApiDocument,
    };
    spec.paths = {
      '/orgs/{org_id]}/example': {
        get: {},
      },
      '/goof/example': {
        get: {},
      },
    };

    // Act
    const result = await spectral.run(spec);

    // Assert
    expect(result).not.toHaveLength(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'apinext-paths-tenants',
          message: 'APIs must have an org or group tenant',
        }),
      ]),
    );
  });

  it('fails if a path operation does not have a summary', async () => {
    // Arrange
    const spec = {
      ...openApiDocument,
    };
    spec.paths = {
      '/orgs/{org_id]}/example': {
        get: {
          description: '',
          operationId: '',
          parameters: [
            {
              name: 'org_id',
              in: 'path',
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
    const errors = getAllErrors(result, 'apinext-operation-summary');
    expect(errors).toHaveLength(1);
  });

  it('fails if a path operation does not have tags', async () => {
    // Arrange
    const spec = {
      ...openApiDocument,
    };
    spec.paths = {
      '/orgs/{org_id]}/example': {
        get: {
          description: '',
          operationId: '',
          parameters: [
            {
              name: 'org_id',
              in: 'path',
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
    const errors = getAllErrors(result, 'apinext-operation-tags');
    expect(errors).toHaveLength(1);
  });
});
