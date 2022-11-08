.PHONY: all
all: build

.PHONY: build
build: build-docker

.PHONY: build-docker
build-docker:
	scripts/build-docker.bash

.PHONY: release
release: release-docker release-npm

.PHONY: release-docker
release-docker:
	scripts/release-docker.bash

.PHONY: release-npm
release-npm:
	scripts/release-npm.bash

node_modules:
	npm install

.PHONY: test
test: node_modules
	npm test

.PHONY: clean
clean:
	$(RM) -r node_modules
	$(RM) -r build
