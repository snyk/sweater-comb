# About this project

## How to use

Sweater Comb should work out of the box when using the sample service templates.

### Removing endpoints
The service templates contain example endpoints. Removing them will result in a linting error due to the breaking change.
It is possible to exclude these endpoints from both linting & spec generation by using the `excludes` property e.g..
```yaml
apis:
  internal:
    resources:
      - path: "internal/api/intl/resources"
        linter: api-resource
        excludes:
          - "**/internal/api/intl/resources/repos/2022-04-04/spec.yaml"
```



COMING SOON:
- How to contribute (link to or supplement CONTRIBUTING)
  - Amending the standards, proposing changes, etc.
  - Making standards executable -- writing Optic CI rules
- How we release
- How to install, use
- API operations and governance
