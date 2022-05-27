# Snyk REST API Standard

In order to provide a consistent [API as a platform](../principles/api_program.md), Snyk APIs have additional requirements, building on [JSON API](../principles/jsonapi.md) and [Versioning](../principles/version.md) standards.

## Organization and group tenants for resources

Resources in the Snyk v3 API are located under an Organization and possibly a Group tenant, specified as a path prefix.

Resources addressed by Organization begin with `/v3/orgs/{org_id}/...`.

Resources addressed by Group begin with `/v3/groups/{group_id}/...`.

## Standard property conventions

Additional resource properties that must be used in resource attributes, where applicable.

### Resource lifecycle timestamps

These properties are optional on a resource, but should be used when applicable. These properties must be formatted as [ISO-8601 date-time strings](https://json-schema.org/understanding-json-schema/reference/string.html#dates-and-times).

#### `created`

When the resource was created (POST).

#### `updated`

When the resource was last updated (PATCH).

#### `deleted`

When the resource was deleted (DELETE), if the DELETE operation marks the
resource for deletion, or removes part of its content without actually removing
the existence of the resource.

## Naming Conventions

Casing conventions referenced below are defined in [Spectral's casing function documentation](https://meta.stoplight.io/docs/spectral/ZG9jOjExNg-core-functions#casing).

### Resource collections are plural

API paths locate resources and collections of resources. These are always nouns. Collections should use the plural form of the noun. For example:

* `/things` (collection of things)
* `/things/{thing_id}` (a specific thing, located in a collection of them)
* `/orgs/{org_id}/other_things` (a collection located in a specific org, located in a collection of orgs)

### Mixed case and acronyms

When using camel or pascal case, acronyms are treated as any other concatenated word. For example, `OrgId`, not `OrgID`. This avoids ambiguity and information loss that would otherwise interfere with automated processing of the API schema. For example, a camel case name following these acronym rules can be translated into snake case to produce more conventional Python symbol names.

### Parameter names and path components

Resource collection names, parameters and path variables must use **snake case** names.

```json
/some_resource/{resource_id}?foo_param=foo&bar_param=bar
```

Because these variables are represented in URLs, uppercase letters may cause problems on some client platforms; RFCs recommend that URLs are treated as case-sensitive, but it is a "should", not a "must". Dashes might cause problems for some code generators, ruling out kebab case.

### Referenced Entities

Entities referenced in other documents (using `$ref`) must use **pascal case** names.

Entities will be commonly represented as types or classes when generating code. Pascal case names are conventionally used for such symbols in most targeted languages.

### Schema properties

Schema properties use **snake case** names.

### Operation IDs

When naming an operation, think carefully about how it will look and feel in generated code. Operations generally map to method or function names.

Operation IDs should be readable, intuitive and self-descriptive.

Operation IDs must use **camel case** names. Example:

```json
operationId: getFoo
```

#### Prefix the operation ID with the action being performed

- GET becomes `get` for a single resource (by unique ID)
- GET becomes `list` for multiple resources (pagination and filtering)
- POST becomes `create`
- PATCH becomes `update`
- DELETE becomes `delete`

#### Suffix the operation ID with the name of the resource

Use the singular form if the operation operates on a single resource, plural if it operates on a collection operation.

Examples:
- `getFoo` (get one)
- `listFoos` (get many)
- `createThing` (create one)
- `updateOtherThing` (update one)
- `deleteThings` (bulk delete)

#### Suffix the resource with tenancy if needed

If there are operations which allow addressing the resource by multiple tenancies (a containing resource), differentiate these as a "by resource" name suffix.

Example: `getFooByOrg`, `deleteProjectByGroup`, etc.

### Header field names

```json
headers:
    snyk-requested-version: "2021-08-21~beta"
    snyk-resolved-version: "2021-08-12~beta"
```

[Header field names are case insensitive](https://datatracker.ietf.org/doc/html/rfc7230#section-3.2). Snyk v3 API specs must use kebab case for consistency. All non-standard headers that are unique to Snyk must begin with `snyk-` (e.g. `snyk-requested-version`).

## <a id="response-headers"></a>Response Headers

Certain headers are required in all v3 API responses.

- `snyk-request-id` - Relays a provided request UUID, or generates a new one, which is used to correlate the request to logs and downstream requests to other services.
- [Versioning response headers](../principles/version.md#response-headers).

## <a id="status-codes"></a>Status Codes

In addition to the status codes specified in [JSON-API#Responses](https://jsonapi.org/format/#fetching-resources-responses), we have standardized on additional situations across our surface area, specifically, for dealing with error cases.

All status codes must be listed in this section or as a part of the [JSON-API Specification](https://jsonapi.org). As a general guiding principle, we strive to limit the number of status codes we return into large categorically distinct areas to make working with the Snyk API easier for end-users.

### 400 - Bad Request

A bad request status code & error response must be returned when the user provided an syntactically invalid request header, query parameters, path parameters, or request body. For example, if an `Authorization` header was malformed, then we'd return a `400 Bad Request` where as if we were provided an expired credential (e.g. JWT), we'd want to return a `401 Unauthorized`.

### 401 - Unauthorized

An unauthorized status code & error response must be returned when the requester provides an invalid (e.g. a bad signature) or expired credential. For example, if a requester were to provide a credential (e.g. a JSONWebToken) that was not signed by Snyk, we'd return a `401 Unauthorized`.

### 403 - Forbidden

A forbidden status code & error response must be returned if the requester has provided a valid credential but the identity (e.g. user, service account, app) does not have the required permissions to perform the action. For example, if a user attempts to add a user to an organization but does not have the appropriate permissions to do so. A forbidden should only occur on _write_ actions such as a create, update, or delete. If the requester does not have read access they should receive a `404 Not Found`.

### 404 - Not Found

A not found status code & error response must be returned if the requested resource does not exist _or_ if the requester *does not* have access to the underlying resource. For example, if an org named `pineapple` exists but the user `joe` is not a member of the organization, then Joe should receive a `404 Not Found` when requesting any information related to the `pineapple` organization.

### 409 - Conflict

A conflict status code & error response must be returned if a requested _write_ action cannot be performed because it collides with some constraint (e.g. a unique constraint violation). This status code is also useful when processing idempotent requests which currently are not supported as a part of the Snyk API.

### 429 - Too Many Requests

A too many requests status code & error response must be returned if the requester has exceeded their request quota for some given time period.

## API Documentation

The quality of documentation generated from an OpenAPI specification depends quite a bit on content provided in certain fields. [Redoc](https://redoc.ly/docs/redoc/quickstart/intro/)-generated documentation is used below to illustrate the purpose of these fields and why we require them.

### Tags

The operations (GET, POST, etc) declared for resource paths must be organized with [Tags](https://swagger.io/specification/#tag-object). Tags are used to categorize the endpoints that operate on resources.

![Documentation with operation tags](media/docs_demo_tags.png)

Tags organize the operations such as "List Issue Summaries" or "Get a Snyk Code Issue" under a single Resource category "Issues".

### Operation Summary

The [operation](https://swagger.io/specification/#operation-object) `summary` field provides a more useful and informative string that documents what the request method actually does. In the example above, one operation summary shown is "List Issue Summaries". If this is not specified, the `operationId` (getIssuesSummary) would have been displayed instead.

### Formats

`format: uuid` and `format: date-time` are essential for indicating a field is not just a string, but actually a UUID or an RFC3339 date string. This format is relied upon by request and response validation middleware.

Enum types (`{type: string, enum: [...]}`) should be used wherever it is possible to enumerate a closed set of valid values a field might have. This includes the set of resource types in our API.

![Documentation with property formats](media/docs_demo_formats.png)

Enums make for great self-documenting APIs.

## Examples

Request parameters and data attributes in response data [schema objects](https://swagger.io/specification/#schema-object) need the `example` field set in order to provide useful documentation. These are

![Documentation with examples](media/docs_demo_with_examples.png)

With examples, it's clear what to expect. One could even run a mock API server with this content!

![Documentation without examples](media/docs_demo_without_examples.png)

Without examples, as an end-user I don't have much context here to know what these fields' values are going to look like! Links are most likely URLs, not just strings!

## Making the OpenAPI specification available

Every service in the v3 API must publish endpoints that list available versions and fetch specific published versions of the OpenAPI spec for all resources provided by that service to v3. These paths may be prefixed if needed (some services may provide other APIs in addition to v3).

These endpoints need to be defined in the OpenAPI spec at all versions. They are not JSON API resources, and are not themselves versioned. Response type is `application/json`.

### /openapi

Lists the available published versions of the API. Response body is an array of version strings.

### /openapi/{version}

Provides the OpenAPI 3 spec at `{version}` in JSON format. The version is resolved by [the same rules used to match the requested version](../principles/version.md#resolving-versions).
