# @snyk/sweater-comb

Sweats the small stuff, so you don't have to. OpenAPI linting rules for Snyk APIs.

# [Intro](docs/intro.md)

At Snyk, we're starting an API program that aims to maximize the value we provide to developers and the extensibility of our platform through our APIs. 

Such an API needs some guardrails to stay cohesive, consistent and "unsurprising" to its consumers, as the platform scales in the number of concepts it provides and the number of teams delivering them.

Sweater Comb helps provide some of those guardrails with automation, initially by applying custom [Spectral](https://stoplight.io/open-source/spectral/) linter rules to our OpenAPI specifications.

[Read more about our API program here](docs/intro.md).

# [JSON API: The Good Parts](docs/jsonapi.md)

## What is JSON API?

[JSON API](https://jsonapi.org/) is a standard for representing resources as JSON data.

Generally, our API adheres closely to the [JSON API specification](https://jsonapi.org/format/). [JSON API: The Good Parts](docs/jsonapi.md) describes how we adapted JSON API into our API standards.

## Why build on JSON API?

We found JSON API to be an excellent starting point for a resource-based API, formatting and structuring JSON data in requests and responses. Leveraging JSON API's opinionated choices enabled us to focus more on designing and building the actual content of our API.

## Our JSON API implementation, by example

What does JSON API look like? What do I need to know to get started building a resource in 5 minutes? Let’s cover the basics first; you can always refer to the JSON API specification for a deeper understanding of specific details.

[Read more about our experiences with JSON API here](docs/jsonapi.md).

# [Versioning](docs/version.md)

How we version our API, and more to the point, API requirements necessary in order to implement our versioning scheme.

[Read more about how we version here](docs/version.md).

# [Snyk API Standards](docs/standards.md)

[Everything else; other requirements we found necessary to keep our API nice and neat](docs/standards.md).

# Installation

TODO
