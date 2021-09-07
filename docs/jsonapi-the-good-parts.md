# JSON API: The Good Parts

# Why JSON API?

[JSON API](https://jsonapi.org/) provides opinionated, reasonable defaults for
an API built on HTTP and REST. The advantage of starting from such a
specification and embracing its constraints, is freedom to focus on modeling the
application domain -- the actual content of the API -- rather than sweating the
small stuff.

In this regard, JSON API solves matters of:
- How errors should be formatted
- How resources relate to each other
- How to determine the identity and type of a resource

"The Good Parts" serves as a guide from our experiences with adopting JSON API.

Some parts of the specification we found less useful -- here we want to explain
where and why our API avoids parts of the JSON API specification, or departs
from it out of necessity. This isn't intended as an indictment of JSON API's
shortcomings, just an indication where it didn't fit our particular needs in
certain situations. This section is "The Rough Parts".

Finally, there are inevitable parts of APIs which do not quite fit into JSON
API's model -- the requirements are simply disjoint with its entire premise. The
exceptions we ran into are "The Spare Parts".

## How to read this document

This document complements the JSON API specification, which goes deep on
details, by instead going broad in concepts. These concepts are linked to
relevant parts of the spec where possible.

Treat it like a commentary on the original spec. It may not cover the entire
JSON API specification; it's more like a guide explaining how we used the spec,
what we found useful and why.

#### _Suggestion_

If you want to quickly get up to speed on our flavor of JSON API:

- Read this short document as an overview of what JSON API is all about.
- Skim over the full [JSON API specification](https://jsonapi.org/format/),
  focusing on the good parts.
- Re-read this short document to put it in perspective.

(Note that this might significantly bias you toward our perspective on JSON
API. If that concerns you, read the full JSON API specification)

# Concepts

A review of RESTful concepts in the context of JSON API.

## Resources and collections

JSON API requests are operations performed on resource objects, or collections
of resource objects. Collections are JSON arrays of resource objects.

Resource objects themselves in JSON API are JSON objects with some constraints
on the top-level members.

### Resources and collections are the *direct object of a predicate*

[In the grammatical sense](https://en.wikipedia.org/wiki/Predicate_(grammar)).

The only verbs allowed in these predicates are these existential ones:

- Create - HTTP POST
- Read (retrieve, query, look up, fetch) - HTTP GET
- Update (modify, replace) - HTTP PATCH
- Delete (remove) - HTTP DELETE

The subject (the one who is *doing* the thing) may be regarded as the server
acting on behalf of the user request.

API requests are sentences requesting "hey API, please do X to Y".

"API, please create this new Thing."

"API, please retrieve the Thing with ID xyz."

"API, please change the name field on Thing with ID xyz to 'foo'".

### Resources have an *identity* and a *type*

Each resource object declares a distinct type and a unique identity. This is
expressed in the schema of the object itself, as a _type_ and _id_ field.

In a well-organized API, knowing a resource object's id and type should be
enough to locate it with a URL.

When creating a resource, the _id_ is often assigned by the server, especially
for security and data integrity purposes, so the _id_ field may be left out. The
other resource object structural guidelines still apply. The service may reject
a client-assigned ID.

#### _Recommendation_

Use plural nouns for _type_ names.

Use server-assigned UUIDs for the _id_.

### Resource "contents" go in _attributes_

The actual contents of a resource object in JSON API goes in its _attributes_
property. This is where the actual domain model goes. It must be an object (not
an array, or a value type).

#### _Recommendation_
A resource object's `type` should map to a single JSON Schema defining the
structure of the `attributes` object value.

### Collections are paginated

JSON API suggests pagination as an option. In our APIs, we found it to be
essential for performance reasons, so we require it in most collection
responses.

## Paths

Paths define where resource objects are located. JSON API does not prescribe how
paths in an API should be organized -- only that they are consistent with
[Links](#Links).

#### _Recommendation_
Locate resources in the least surprising, most obvious place: `/{type}/{id}`,
where _type_ is the resource type, and _id_ is the resource id.

When types are plural nouns, paths read like a catalog of resources. `/things`
is a collection of things, `/things/0a97a46c-b702-4c3e-869a-41c6d5174724` gives
you a specific individual thing from that collection.

Other dimensions may be expressed with query parameters on a resource
collection, or a relationship to a resource, as appropriate.

## Links

Links are not required by JSON API, but we generally require them in our APIs.

### Self-links

Self-links serve as a useful resource identifier, in addition to being a
breadcrumb trail for how the resource was obtained, made globally unique by the
addition of the service hostname. This may be especially useful in a distributed
architecture.

### Pagination links

Adopting JSON API pagination links normalize pagination conventions across
an API quite nicely. We use the recommended pagination link keys in
[6.6, Pagination](https://jsonapi.org/format/#fetching-pagination).

### Links form a graph of relationships between resources

These links enable building higher-level interfaces to traverse and consume the
resources' content, like GraphQL. 

#### _Recommendation_

Links are such a great concept in JSON API, but the Links object defined in
[5.6, Links](https://jsonapi.org/format/#document-links) leaves us wanting more.

As we'd like to build a rich resource graph from links, we recommend adding
custom members to the "links" object to express it as needed. A single "related"
member isn't enough. Even if it can express _how_ it's related in its metadata,
there might be a legitimate need to express more than one related resource. So,
we recommend using custom members for expressing this precisely.

JSON API isn't clear on whether this is allowed or not -- just that the members
of the "links" object follow a certain schema. Because our APIs are versioned
well, we are confident that we'll be able to navigate any conflicts with future
versions of JSON API.

## Responses

Generally we find JSON API's recommended and required responses to be useful and
sensible defaults.

## Errors

### Errors have an identity

Each error has a unique identity. This allows errors to reference each other in
a response. It's arguably of marginal use, but harmless and potentially useful.

### Errors have context

The _meta_ field is used to provide application-specific details, such as a
Request ID.

#### _Recommendation_

Duplicating header fields, such as log correlation, tracing or request IDs in
the metadata can be quite useful to end users. In some cases someone
experiencing a problem may not have the response headers, but they may have the
content.

This metadata content may also be more easily rendered in a web UI.

Surfacing such information can improve the technical support experience for the
API.

# The Rough Parts

Parts of the JSON API spec that were problematic, amended or avoided entirely.

## Query parameters

### Implementation-specific parameters

We do not apply constraints on query parameter names, as required in
[8, Query Parameters](https://jsonapi.org/format/#query-parameters).

While our parameter naming convention is "snake_case" (underscore-delimited),
not all parameter names are multi-word. The addition of a non a-z character
would be unnecessarily awkward.

We were also not concerned with conflicts with future changes to the JSON API
specification for two reasons:

1. We have an established API versioning scheme which would
   allow us to adapt to future changes in JSON API.

2. We haven't found existing reserved parameter names to be very useful,
   other than `sort`.

### JSON API parameters

JSON API reserves several query parameters for special purposes. Several of these,
we found problematic and decided not to use, favoring our own parameter names
for these concepts.

#### Sparse fieldsets

JSON API's `fields[TYPE]` parameter expresses specific fields to only include in
a GET request. We found the square brackets made URLs less readable and
intuitive to read and write, since these characters must be URL-encoded.

#### Pagination

We had the same issue with JSON API's pagination parameters, which also use
square brackets (suggesting namespaced parameters like `page[number]`,
`page[size]`, `page[offset]`, etc.).

#### Filtering

JSON API recommends similarly putting filtering arguments in a single `filter`
parameter. We found this erased really useful information from the OpenAPI
specification, which would otherwise describe the supported filtering criteria
for a resource, if separate query parameters were used instead.

## Relationships are complicated

We found sparing use of the relationships object to be useful in some
circumstances.

JSON API provides for some complex combinations of relationships and pagination
which we avoided. Rather than support paging through relationships on a
top-level resource, we recommend using links to reference the related collection
directly.

## Relationships are not required to support updates

We decided not to require resources to support updates through relationships, as
recommended in [7.3.2, Updating To-Many Relationships](https://jsonapi.org/format/#crud-updating-to-one-relationships).

Links should suffice for locating related resources to update directly.

This keeps the server implementation simple. It also avoids cross-service
coupling. One service may find it convenient to proxy related resources from
another service, but find it inconvenient to offer full write-through support.

## Compound documents and "includes"

We avoid JSON API's [compound documents](https://jsonapi.org/format/#document-compound-documents)
and do not allow their use in our APIs. We found the `included` response field
to be especially problematic. As defined by JSON API, it is an array of any
object type. This causes problems for code generation, especially static-typed
languages like Go.

We also felt that compound documents have a use-case better served by
higher-level interfaces built on top of a REST API, like GraphQL.

## Responses

There are some cases where API clients may need to expect and handle error
responses that do not conform to JSON API:

- Gateway errors
- Configuration errors (dns, routing, ingress)
- Rate limiting errors
- Load balancer errors
- CDN errors

These are generally upstream errors that are outside the control of the service
providing an API. While it might be possible to have some of these error types
conform to JSON API, it may not be possible in all cases.

# The Spare Parts

It's unlikely that your entire API will fit the JSON API paradigm -- or even our
opinionated adaptation of it.

For these parts of the API, use a different content type, and a separate path
hierarchy to keep the distinction clear. They can coexist with JSON API in the
same service, just organize and tag them appropriately in the OpenAPI spec.

A few situations where these exceptions emerged in our APIs:

- GraphQL
- OAuth flows
- Service-to-service RPC
