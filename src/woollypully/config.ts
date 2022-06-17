import * as fs from "fs/promises";
import * as yaml from "yaml";

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

  constructor(
    proposedBaseURL: string,
    currentBaseURL: string | undefined,
    listenPort: number,
  ) {
    this.proposedBaseURL = proposedBaseURL;
    this.currentBaseURL = currentBaseURL;
    this.listenPort = listenPort;
  }
}

export const getConfig = async (): Promise<Config> => {
  let proposedBaseURL: string | undefined = process.env["PROPOSED_SERVICE_URL"];
  if (!proposedBaseURL) {
    proposedBaseURL = await loadCerberusUpstreamURL(
      process.env["CERBERUS_CONFIG_PATH"],
    );
  }
  if (!proposedBaseURL) {
    throw new Error("failed to determine proposed service URL");
  }

  const currentBaseURL: string | undefined = process.env["CURRENT_SERVICE_URL"];
  if (!currentBaseURL) {
    console.log(
      "warning: CURRENT_SERVICE_URL not specified; lifecycle rules cannot be verified",
    );
  }

  const listenPort = parseInt(process.env["PORT"] ?? "30576");

  return new Config(proposedBaseURL!, currentBaseURL, listenPort);
};

/**
 * loadCerberusUpstreamURL loads the upstream URL from the given Cerberus config
 * file path.
 */
export const loadCerberusUpstreamURL = async (
  cerberusConfigPath = "/cerberus/config/cerberus.yaml",
): Promise<string | undefined> => {
  try {
    const cerberusYAML = await fs.readFile(cerberusConfigPath);
    const cerberusConfig = yaml.parse(cerberusYAML.toString());
    return cerberusConfig?.upstream?.address ?? undefined;
  } catch (err) {
    throw new Error(`failed to load Cerberus config ${cerberusConfigPath}`);
  }
};
