# optic-ci

This repository contains

- the sweater-comb rules
  - written typescript
  - unit tested with Jest snapshots in `/rulesets/tests`
  - registered with the check service here `service.ts`
```typescript
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require('./rulesets/operations').rules,
  );
  snykRulesService.useDslWithNamedRules(
    dslConstructor,
    require('./rulesets/properties').rules,
  );
```
- Snyk's instance of optic-ci, with the rulesets included at build time `index.ts`

### Testing with the CLI during development
1. Manual run the CLI with `ts-node src/index.ts`, eqiv to calling `optic-ci`
   - `ts-node src/index.ts compare --from src/example-specs/quick/current.yaml --to src/example-specs/quick/next.yaml`
2. (automated test scenarios) -- coming soon


### Todos
- Get real test data into this repo and write end-end tests with real Synk specs and vervet context -- *optic*
- Wire up Docker build, vervet integration, etc -- *optic + snyk collab*
- Complete the lifecycle rules: progress https://www.notion.so/useoptic/35ce451bbe2542249518c24d37448906?v=8e0e7be44fde4eeaa0ad777849fd0223 -- *optic*
- **Milestone: Optic CI Lifeycle rules work end-end**
- Port built-in and custom Spectral Rules to Optic-CI -- *optic, will release a few at a time*
