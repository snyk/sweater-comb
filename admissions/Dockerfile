### BUILD

FROM golang:1.18 as builder
WORKDIR /go/src/admissions

# Download and cache module dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build go build -v -o /go/bin/admissions .

### RUNTIME

FROM gcr.io/distroless/base-debian11

COPY --from=builder /go/bin/admissions /
WORKDIR /

USER nonroot

EXPOSE 8443
ENTRYPOINT [ "/admissions" ]
