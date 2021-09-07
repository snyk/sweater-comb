# @snyk/sweater-comb

Opinionated rules for Snyk APIs.

# What/Why is Sweater Comb?

At [Snyk](https://snyk.io) we've seen amazing growth and adoption of our APIs.
As we scale our products, services and teams to meet this demand, we're trying
to strike a balance between team autonomy and product alignment. How can we keep
the innovation and productivity of small teams, and still end up with an API
that looks and feels like a single, polished product?

Our attempt at this balance is Sweater Comb, an opinionated collection of
OpenAPI linter rules built on
[Spectral](https://stoplight.io/open-source/spectral/) custom rulesets, which
codify basic standards we want to maintain across our APIs.

These rules emerged from several guiding principles.

## Resources, not endpoints

The Snyk REST API should transparently represent and express our product's data
model, using resources and collections. This will enable higher-level interfaces such as GraphQL and partner
integrations we haven't even dreamed up yet.

## Resources should be versioned

Resources should be versioned, so that:

* Development teams have the freedom to release those parts of the API they are
  responsible for, at their own cadence, without interfering with, or being
  blocked by other teams, as much as possible.
* Versions come with a stability commitment: a promise to provide and support
  that version for a period of time. An experimental version may be ephemeral,
  lasting only days or weeks, while a beta or GA version comes with longer
  guarantees.
* API consumers can opt-in to any version of our API.
  They should be able to pin such versions to avoid disruption and test against
  newer versions when they're ready.

## JSON API (The Good Parts)

We found the [JSON API](https://jsonapi.org/) specification aligned well with
our RESTful API principles. When we got around to really digging in to the
specification though, we found a few rough edges. So, we slightly modified some
conventions, and left out others in those few places where these conflicted with
our goals.

[JSON API: The Good Parts](docs/jsonapi-the-good-parts.md) is our take on JSON API.

## Documentation and SDKs

OpenAPI 3 enables automatic generation of rich developer documentation and
client SDKs for our APIs. Certain OpenAPI conventions are necessary in order to
make the most of documentation and code generation tools.

## Consistency

Finally, we want our API to be consistent for the sake of predictability. Naming
conventions, casing, common parameters and response headers -- these are
important to get right, yet at the same time, difficult to keep track of, keep
consistent, and keep up-to-date on, over many moving parts in many codebases. We
want to lint these rules so our developers don't have to.

## Summary

For those of you using Snyk, this might be an insightful, insider view into how
we've organized our API. For someone starting a project and just looking for
something to get started, this might be a useful start.

# Install

## NPM

`npm install @snyk/sweater-comb` in your project.

# Usage

Configure Spectral in your project to extend these rules. Example `.spectral.yaml`:

```yaml
extends:
  - "@snyk/sweater-comb"
```

You can also choose rulesets a-la-carte:

```yaml
extends:
  - 'node_modules/@snyk/sweater-comb/naming.yaml'
  - 'node_modules/@snyk/sweater-comb/responses.yaml'
  - 'node_modules/@snyk/sweater-comb/versioning.yaml'
```

# Contact

[#ask-elk](https://snyk.slack.com/archives/C01HY22DV0F)
