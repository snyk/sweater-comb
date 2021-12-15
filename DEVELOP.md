## Running CLI in development mode

```bash
yarn install
source sourceme.sh
```

This will install the dependencies, and put `opticCiDev` on your path for the duration of that terminal's lifespan.

Running the compare command:
```bash
opticCiDev compare \
    --from end-end-tests/simple-scenario/current.yaml \
    --to end-end-tests/simple-scenario/next.yaml \
    --context $(contextFromFile end-end-tests/simple-scenario/context.json)
```

FAQ:

**If I write code, do I have to build or source this again before it will work?**
No. Under the hood `opticCiDev` is using `ts-node` to compile the code on the fly (also why it's a bit slow). A typescript error will break the compiler and you'll get feedback as you try to run the command.

However, for most cases, it probably makes sense to write unit tests for your rules in src/rulesets/tests

**What should my `context.json` have in it?**
See `SynkApiCheckContext` in `src/dsl.ts` -- there is a defined shape in which the rules expect context to come in from vervet

**I'm not sure how to write a rule we need. Who should I ask for help?**
@acunniffe on GitHub, open an issue and tag him :)

**I do not like an error message, something in the UI/UX of the tool, where should I talk about it?**
Open an issue :)
