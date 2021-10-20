const { Spectral } = require('@stoplight/spectral-core');
const { specFactory, loadOneRule } = require('./utils');

let rules, spectral;
const ruleName = 'openapi-arrays-types';

beforeAll(async () => {
  const rule = await loadOneRule('spec.yaml', ruleName);

  rules = {
    rules: { [ruleName]: rule },
  };
});

beforeEach(async () => {
  spectral = new Spectral();
  spectral.setRuleset(rules);
});

it('passes if array has a type field', async () => {
  // arrange
  const path = {
    get: {
      description: 'example path',
      operationId: 'getExample',
      parameters: [
        {
          in: 'query',
          name: 'tags',
          schema: {
            type: 'array',
            items: {
              pattern: '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$',
              type: 'string',
            },
          },
        },
      ],
      responses: {
        200: { description: 'OK' },
      },
    },
  };

  const spec = specFactory({
    paths: { '/example': path },
  });

  // act
  const result = await spectral.run(spec);

  // assert
  expect(result).toHaveLength(0);
});

it("fails if array doesn't have a type field", async () => {
  // arrange
  const path = {
    get: {
      description: 'example path',
      operationId: 'getExample',
      parameters: [
        {
          in: 'query',
          name: 'tags',
          schema: {
            type: 'array',
            items: {
              pattern: '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$',
            },
          },
        },
      ],
      responses: {
        200: { description: 'OK' },
      },
    },
  };

  const spec = specFactory({
    paths: { '/example': path },
  });

  // act
  const result = await spectral.run(spec);

  // assert
  expect(result).not.toHaveLength(0);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'openapi-arrays-types',
        message: 'Array items must have a "type" field.',
        path: [
          'paths',
          '/example',
          'get',
          'parameters',
          '0',
          'schema',
          'items',
        ],
      }),
    ]),
  );
});
