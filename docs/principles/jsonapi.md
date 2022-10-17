# JSON API

## What is JSON API?

[JSON API](https://jsonapi.org/) is a standard for representing resources as JSON data.

Generally, our API adheres closely to the [JSON API specification](https://jsonapi.org/format/), with some caveats noted in the following section ["The Rough Parts"](#the-rough-parts).

## Why build on JSON API?

We found JSON API to be an excellent starting point for a resource-based API, formatting and structuring JSON data in requests and responses. Leveraging JSON API's opinionated choices enabled us to focus more on designing and building the actual content of our API.

## Our JSON API implementation, by example

What does JSON API look like? What do I need to know to get started building a resource in 5 minutes? Let's cover the basics first; you can always refer to the JSON API specification for a deeper understanding of specific details.

### Responses and the top-level object

Generally, most of our JSON API responses look something like this. While the spec makes some of these optional, these fields are generally required in our API's top-level object responses.

```json
HTTP 200 OK
Content-Type: application/vnd.api+json

{
    "data": { /* ... */ }, // resource or array of resources,
    "jsonapi": {"version": "1.0"},
    "links": {
        "self": "/path/to/here", // path to this resource you just requested
    }
}
```

Some optional JSON API fields may be specified in addition to these, but this is the minimum basic structure that our responses must provide.

### Server-assigned identity

Our resources generally get server-assigned IDs when they are created. Same structure, but the response status code when an ID is assigned is `HTTP 201 Created`.

### Data

Resource data objects have a certain structure as well.

```json
{
    "id": "7d1bae82-346a-4f7b-a8cb-37c8f159e415", // unique uuid of this resource,
    "type": "resource-type", // resource type,
    "attributes": {
        // actual resource content here
    }
}
```

Collections are just arrays of these structured resource data objects.

```json
[{
    "id": /* some ID */,
    "type": /* some type */,
    "attributes": {/* ... */}
 },
 /* ... */ ]
```

### Links

JSON API Links are like hyperlinks with context. They can be simple URL strings:

```json
links: {
    "self": "/path/to/this/resource"
}
```

They can also provide metadata with a bit more structure. Either form is valid:

```json
links: {
    "self": {
        "href": "/path/to/this/resource",
        "meta": {
            // free form key-value stuff about this link
        }
    }
}
```

All top-level responses require a self-link.

Links must be absolute paths. They may indicate a host if the hostname is known / knowable at response creation time. The protocol, host and/or path prefix may need to be rewritten by an API gateway in order for links to resolve correctly across multiple backend services.

### Relationships and Links

Data objects may declare relationships to other resources — "links with structured context".

```json
{
    "id": "7d1bae82-346a-4f7b-a8cb-37c8f159e415", // unique resource uuid
    "type": "some-resource", // resource type
    "attributes": { /* ... */ },
    "relationships": {
        "relation-name": {
            "links": {
                "related": "/path/to/<related resource>/<related-id>?version=<resolved version>&..."
            },
            "data": {
                "id": "9f14199e-6330-4b01-a52d-4aaa0ffd29ef", // related entity's ID
                "type": "other-resource", // related entity's type
            },
        },
        /* ... */
    }
}
```

`relationships` is a mapping of "relation name" ⇒ "relation object". That relation object must conform to the structure shown above; it should provide `links.related`, and must provide `data.id` and `data.type`.

### <a id="relationships-and-expansion"></a>Relationships and Expansion

Snyk REST APIs support expansion of related resources by enriching relationship [resource identifier objects](https://jsonapi.org/format/#document-resource-identifier-objects) with attributes. Snyk APIs use relationship expansion as an alternative to JSON API [Compound Documents](#rough-compound-documents). This is a Snyk extension to the JSON API specification.

```json
{
    "id": "7d1bae82-346a-4f7b-a8cb-37c8f159e415", // unique resource uuid
    "type": "some-resource", // resource type
    "attributes": { /* some-resource's attributes */ },
    "relationships": {
        "other-resource": {
            "links": { /* ... */ },
            "data": {
                "id": "9f14199e-6330-4b01-a52d-4aaa0ffd29ef", // related entity's ID
                "type": "other-resource", // related entity's type
                "attributes": { /* other-resource's attributes */ }
            },
        },
        /* ... */
    }
}
```

### Pagination and Links

Pagination is defined by Links in JSON API as well, which require all of these fields:

```json
links: {
    "first": "/path/to/first/page",
    "last": "/path/to/last/page",
    "prev": "/path/to/previous/page",
    "next": "/path/to/next/page"
}
```

If some links are unavailable (no previous page at the first page, no next at the last page, etc.) then the value is `null`. Some links such as `last` may be `null` when providing them would be prohibitively resource-intensive. These links contain [pagination parameters, as defined below](#pagination-parameters).

## Errors

Errors have a certain minimum required structure as well.

```json
HTTP 400 Bad Request
Content-Type: application/vnd.api+json

{
  "jsonapi": {"version": "1.0"},
	"errors": [{
		"id": "c246c156-870c-4dbb-9cea-60850d6c8686", // unique id for the error itself
		"status": "500", // HTTP status code, as a string
		"detail": "something bad happened", // detailed message explaining what went wrong
	}, /* ... */ ]
}

```

The error ID should uniquely identify this occurance of the problem. A server-generated trace or request ID may be used for this ID, so long that the ID is unique. If there are multiple errors in the response, each must have a unique ID.

A Request ID header is also required in our [standard responses](../standards/rest.md#response-headers), which should be considered authoritative for correlation purposes.

### Request paths

- Paths should be as flat as possible.
    - For tenant-by-organization reasons, Snyk's API paths are prefixed with `/orgs/{org_id}`.
    - Paths must support the `/orgs/{org_id}` prefix.
    - Paths should support the `/groups/{group_id}` prefix.
- Standard paths for a resource collection of "things". Resources are located under a base path that is a collection, followed by an identifier to address an individual resource. Because that base path is a collection, use the plural form ("things" not "thing").
    - `POST /things` to create a new thing
    - `GET /things` to list them (with optional query filters and pagination)
    - `GET /things/:id` to get a single one
    - `PATCH /things/:id` to modify one
    - `DELETE /things/:id` to remove one

### Query parameters and JSON API

JSON API is highly prescriptive with query parameters, though they are only SHOULD suggestions, not MUST requirements. In particular, it suggests:

- Putting all filtering criteria into a single `filter` query parameter
- Putting all pagination criteria into a single `page` query parameter
- Using `fields` for all sparse fieldsets
- Using square-brackets to sub-divide these parameters, like a namespace.
    - `page[offset]=5` or `filter[project]=phoenix` for example.

It's an interesting idea, but we found it took away from usability and clarity in our API. Square brackets are escaped, making URLs harder for humans to read and modify. Such parameters are also not supported by OpenAPI.

As an alternative we decided to standardize on our own domain-specific query parameters for consistency with respect to our data model across the API.

One reason JSON API states for name-spacing parameters with brackets, is compatibility with future versions of the standard. With our strong versioning scheme, we are confident we will be able to evolve with such changes in standards over time.

### <a id="pagination-parameters"></a>Pagination parameters

Pagination in our API is cursor-based. Cursor-based pagination provides a page of N records before or after a specific record in a data set.

Our API uses these reserved parameters for pagination:

- `starting_after` - Return `limit` records after the record identified by cursor position `starting_after`.
- `ending_before` - Return `limit` records before the record identified by cursor position `ending_before`.
- `limit` - Number of records to return, up to 100

Cursor position identifiers are determined by the links given in a paginated response.

## <a id="the-rough-parts"></a>The Rough Parts

Parts of the JSON API specification we avoided or intentionally depart from.

### <a id="rough-compound-documents"></a>Compound documents

JSON API [compound documents](https://jsonapi.org/format/#document-compound-documents) store all related data objects in an `included` array together, mixing types. An array of `anyOf:` objects can certainly be expressed in JSON Schema, but in practice, this is an awkward data structure to work with, and an unnecessary layer of indirection.

Snyk APIs represent expansion more directly by enriching relationship data with attributes.

### <a id="rough-square-brackets"></a>Square-brackets in query parameters

In sections describing [sparse fieldsets](https://jsonapi.org/format/#fetching-sparse-fieldsets) and [pagination](https://jsonapi.org/format/#fetching-pagination), the JSON API specification suggests the use of square-brackets to parameterize a small set of reserved query parameters.

In our API we found square-brackets made URLs harder to read and write, since they need to be URL-escaped. We also found limited support for this encoding (known as `style: deepObject` in [OpenAPI 3](https://spec.openapis.org/oas/v3.0.3.html#style-values)) in various tooling and libraries.
