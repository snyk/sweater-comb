#FROM stoplight/spectral:6.0.0

## TODO(cmars, 2021-10-4): uncomment above and use 6.0.0 GA once
## https://github.com/stoplightio/spectral/issues/1861 is fixed
## In the meantime, we're installing 6.0.0-alpha3.
FROM node:16-alpine
RUN npm install -g @stoplight/spectral@6.0.0-alpha3

# Sweater Comb's rules are referenced from this absolute path in the container
# image. This will be used in API project scaffolds to unambiguously and
# reliably reference Sweater Comb rulesets.
COPY . /sweater-comb/rules

# The project that is being linted by Sweater Comb should be mounted here.
# Spectral runs in this directory so that paths to linted files as well as any
# project-local overrides can be referenced by paths relative to the project
# top-level.
VOLUME /sweater-comb/target
WORKDIR /sweater-comb/target

ENTRYPOINT [ "spectral" ]
