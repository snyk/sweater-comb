# woollypully

Woollypully uses Sweater Comb rules for API governance over Kubernetes deployments.

## Why?

Prevent releases that do not conform to API standards from seeing the light of day.

## Just-In-Time Gating

### API Discovery

Using a set of well-known endpoints on each microservice, we can:

- Discover what APIs are provided (a service may provide multiple)
- Match on those we need to govern (public OpenAPI ones)
- Apply checks to all the OpenAPI versions provided by those

The main entrypoint in this woollypully sidecar makes use of these endpoints to coordinate the gating.

### Comparing current and proposed

The API discovery isn't exposed outside the pod, so how do we compare the new deployment's pods with those of the current running service?

The proposed service -- the one about to deploy -- is available in the current pod, as woollypully is a sidecar readiness probe.

The current service is available via KubeDNS. Cerberus will need to expose its /api-discovery and /openapi endpoints on a separate, well-known service port, so that woollypully can find it.

Woollypully configuration is then simple, using environment variables:

- PROPOSED_SERVICE_URL is the proposed service URL (likely to be localhost:8080 or another port).
- CURRENT_SERVICE_URL is the current deployed service URL. The admission controller (described more below) will need to find this.

### Sidecar containers and readiness probes

A WoollyPully sidecar container may be injected into pods. The sidecar discovers the APIs, checks their OpenAPI contracts for compliance, and makes a pass / fail determination.

A readiness probe on that sidecar controls whether the pod is considered "ready" and whether traffic may be routed to it.

If the APIs do not meet standards, it never becomes ready...

Beta and GA release versions will be required to pass standards checks. Experimental will not be subject to this check.

### Admission Controller webhooks

The above sidecar and readiness probes are injected by means of a mutating admission controller webhook.

### Breaking glass

If operators need to break glass and bypass the standards check, they should be able to in an emergency. For example, mechanisms we might employ here:

- Patch out the sidecar and readiness probe.
- Exempt a deploy from the webhook.

### Standards versioning

We're going to want to gate an API specification with an appropriate version of the standards.

We never want to block a release because we changed the standards in such a way that past releases no longer conform.

We can solve this using the same versioning scheme as our APIs -- version WoollyPully rulesets by date, and use the most recent ruleset prior to the API version to gate it.

This implies that our distribution of WoollyPully will need to include all cumulative rule versions, since we won't know ahead of time what versions we will need to check.

## Ahead-Of-Time Gating

TODO: design, coming soon!

This is about separating the verification from the readiness check, eliminating redundancy and overhead when the pod starts, "shifting left":

- Standards checks happen during the service's build process.
- Validated OpenAPI specs signed by a cosign key (Project sigstore).
- Signatures verified as the sidecar readiness check above.
- Signatures stored in an OCI registry (ORAS).

Initially cosign keys would be stored as Kubernetes secrets, but longer term, sigstore projects like rekor and fulcio may be integrated into this process.
