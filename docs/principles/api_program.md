# The API Program at Snyk

At Snyk, we’re starting an API Program whose goal it is to create a beautiful garden of repeatable & concise APIs that empower Snyk customers, partners, and Snyk’ers alike to easily and quickly build new experiences and products.

Such an API needs some guardrails to stay cohesive, consistent and “unsurprising” to its consumers, as the platform scales in the number of concepts it provides and the number of teams delivering them.

## Why automate?

Partial automation of API governance and standards compliance yields a tighter feedback loop than a purely manual review of every change.

### Automation is only part of the solution

Before diving into the standards automation in our API, it's worth pointing out that automated checks are limited in what they can catch and cover. Automation is no substitute for thoughtful design and planning when it comes to adding to and extending Snyk's core data model.

Automation is most helpful once such designs have been established. At this point, our automation can provide rapid development feedback to guide an implementation towards successful integration into the platform.

### What Sweater Comb automates

If you read through this document, you will find a lot of rules! A lot of things to keep track of! [RFC2119](https://datatracker.ietf.org/doc/html/rfc2119)-style DOs and DONTs and MUSTs and SHOULDs. And regardless of your opinion on them — everyone has an opinion — we should all agree that a consistent application of *some* sort of rules are necessary to provide a uniform, cohesive API for our customers.

[Sweater Comb](https://github.com/snyk/sweater-comb) is our rule automation solution to address this specific problem — it "sweats the small stuff, so you don't have to". The rules described here are to give a sense of what our choices are and why, but the execution of these rules is actually performed with [Sweater Comb](https://github.com/snyk/sweater-comb) as an OpenAPI linter.

Use Sweater Comb in your individual service projects to keep your service compatible with API standards and ready to promote to beta and GA stability.

Sweater Comb is also used to track the progress of our API standards goals across many projects, as well as to provide API governance in our service integration and deployment pipeline. We want to make sure that the APIs our customers should be able to depend on meet these standards and stability promises, and keep them through the promised lifecycle.

## How to read this document

As mentioned, our API standard taken as a whole is quite a lot of rules and processes, but in this document, they are introduced largely by example with references to more detailed resources.

It's intended to be a place to copy from, while explaining _why_ you should do things a certain way. If I don't give you a place to copy from, you'll copy from the nearest implementation, which might work, but might miss some of that why.

Finally, refer to [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) for the precise meaning of words and phrases like *must*, *must not*, *should*, *should not*, etc.

I hope this document is clear, approachable and for the developers building our new and exciting API, it makes you successful! If it's missing something, please help us maintain it! We all own these standards collectively, and they too can evolve, just like our API versions.

For all others, I hope it is an interesting insight into how we're building APIs at Snyk!

— Casey Marshall, `2021-09-24~beta`

## Resources

Snyk's API is essentially a catalogue of models, represented as *resources*.

### What is a resource?

> The key abstraction of information in REST is a resource. Any information that can be named can be a resource: a document or image, a temporal service (e.g. "today's weather in Los Angeles"), a collection of other resources, a non-virtual object (e.g. a person), and so on. In other words, any concept that might be the target of an author's hypertext reference must fit within the definition of a resource. A resource is a conceptual mapping to a set of entities, not the entity that corresponds to the mapping at any particular point in time.
>
> — Roy Thomas Fielding, _[Architectural Styles and the Design of Network-based Software Architectures, sec. 5.2.1.1](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_2_1_1)_

Our API presents the core models from which Snyk products and services are built, as such resources and collections. Models such as:

- Users
- Organizations
- Groups
- Projects
- Targets
- Issues

Object instances of these all relate to each other in a rich graph of associations, which are represented in the API with hypertext references — links.

### Why present an API of resources?

#### From product to platform

Direct access to these core models allows customers and partners to utilize Snyk as a platform. Instead of waiting for Snyk to add a custom feature or solution, they can easily compose one from our data model in their own applications.

#### Building blocks for greater abstraction

Snyk can provide higher-level abstractions over this API of data models (resources) such as GraphQL and SARIF. Both provide a rich and powerful interface to query and report on SAST results.

### What a resource-based API is (and isn't)

Snyk’s API represents our product’s *core data model* as resources, for the purpose of delivering that data model to our customers and partners.

#### It's not RPC

To keep it about that data, the only operations allowed in the API are "CRUD"-type operations: Create, Retrieve, Update, Delete.

Contrast this with an RPC API which may offer a rich vocabulary of verbs at the granularity of method and function calls on objects. This approach may be necessary and useful in certain situations — however, these belong in a different sort of API from the one we're building here.

#### It's (only) about Snyk's *core data model*

There are situations where it makes sense for Snyk to represent other resources with an API. Many of these may relate to Snyk's core data model. However, if they are describing a different interface or paradigm, they do not belong in the REST API, they should be located elsewhere. Examples of distinctly different models & paradigms:

- GraphQL
    - A generalized query interface that merges many models into a unified graph
- SARIF
    - Industry-standard representation of SAST results
- CSV
    - Data export and reporting representation of results, models, activity
- OAuth
    - Industry-standard authorization flow for third-party integrations

#### It represents this core data model with documentation and client SDKs

Our API is assembled from resources that are themselves defined in [OpenAPI](https://www.openapis.org/). OpenAPI presents a model description from which documentation, client SDKs, as well as internal governance mechanisms such as request and response validators, can be automatically generated.

However, the quality of this generated documentation and code depends entirely on the quality of that model's content. Our experience with generating documentation and code from OpenAPI specs informs many of our standards decisions — from requiring certain fields, to restricting OpenAPI schema definitions so that they can be expressed well in all languages we're targeting in our SDKs.

### Our API Program: How we organize APIs

#### Resources define and shape the platform

Consider carefully and thoughtfully:
- What does the resource really represent?
- How does it relate to other established parts of the platform?

#### Resources define _concepts_

How does the naming of this concept affect the language we use to describe the problems our platform solves?

Consider how this new _concept_ will be represented from different perspectives:
- Product end-user experience
- API developer experience
- Partner integration experience

#### Avoid mixing models or paradigms

Know what models you're working with. When in doubt, ask!

- Different sets of models == different APIs (see above for examples)
- Are you adding to an existing set of models appropriately?
- Or are you working with different (even if related) sorts of concepts entirely?

RESTful APIs (JSON or otherwise) are about representing models as *resources*. Think of such an API as providing a catalogue of model objects.

RPC, when necessary, belongs in a separate API.

Don't worry too much about this separation of models and paradigms! Distinct APIs can relate and link to each other.
