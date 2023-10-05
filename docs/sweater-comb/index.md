# About this project

## Removing support for old endpoint versions

Removing support for an old API version requires:
1. Temporarily ignoring the endpoint version code in `.vervet.yaml`
2. Removing the endpoint versions from `catalog-info.yaml`
3. Removing the old OpenAPI specs.

[Example PR](https://github.com/snyk/registry/pull/33489/files)

## COMING SOON:

- How to contribute (link to or supplement CONTRIBUTING)
  - Amending the standards, proposing changes, etc.
  - Making standards executable -- writing Optic CI rules
- How we release
- How to install, use
- API operations and governance
