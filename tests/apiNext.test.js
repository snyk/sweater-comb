const { Spectral } = require('@stoplight/spectral-core');
const { loadRules } = require('./utils');

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
  let result;

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
    result = await spectral.run(spec);

    // Assert
    expect(result).not.toHaveLength(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'apinext-route-tenant-uuids',
          message: `APIs must use UUIDs where org or group tenants are specified`,
        }),
      ]),
    );
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
    result = await spectral.run(spec);

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
    result = await spectral.run(spec);

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
    result = await spectral.run(spec);

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
});
