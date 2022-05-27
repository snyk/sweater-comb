
export GOBIN := $(shell pwd)/.bin

.PHONY: all
all: admissions

admissions:
	go build .

.PHONY: test
test:
	go test ./... -count=1 -race

.PHONY: install-tools
install-tools:
	GOBIN=$(shell pwd)/.bin go install github.com/cloudflare/cfssl/cmd/cfssl@latest
	GOBIN=$(shell pwd)/.bin go install github.com/cloudflare/cfssl/cmd/cfssljson@latest

