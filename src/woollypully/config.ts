/**
 * Config defines configuration for the woollypully application.
 *
 * Configuration is read from environment variables:
 *
 * PROPOSED_SERVICE_URL defines the base URL of the container hosting the
 * service which is being proposed for deployment.
 *
 * CURRENT_SERVICE_URL defines the base URL of the current deployed service, if
 * one exists.
 *
 * Both PROPOSED_SERVICE_URL and CURRENT_SERVICE_URL must include the protocol,
 * hostname, port and path.
 *
 * PORT determines the listen port that woollypully will respond to requests on,
 * to answer readiness probes on the proposed pod(s) being deployed.
 */
export class Config {
  readonly proposedBaseURL: string;
  readonly currentBaseURL?: string;
  readonly listenPort: number;

  constructor() {
    const proposedBaseURL = process.env["PROPOSED_SERVICE_URL"];
    if (!proposedBaseURL) {
      throw new Error("missing PROPOSED_SERVICE_URL");
    }
    this.proposedBaseURL = proposedBaseURL;

    const currentBaseURL = process.env["CURRENT_SERVICE_URL"];
    if (!currentBaseURL) {
      console.log(
        "warning: CURRENT_SERVICE_URL not specified; lifecycle rules cannot be verified",
      );
      this.currentBaseURL = undefined;
    } else {
      this.currentBaseURL = currentBaseURL;
    }
    this.listenPort = parseInt(process.env["PORT"] ?? "30576");
  }
}
