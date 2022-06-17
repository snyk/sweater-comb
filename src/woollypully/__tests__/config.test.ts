import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { getConfig } from "../config";

describe("config", () => {
  beforeEach(() => {
    delete process.env.PROPOSED_SERVICE_URL;
    delete process.env.CURRENT_SERVICE_URL;
    delete process.env.CERBERUS_CONFIG_PATH;
    delete process.env.PORT;
  });

  test("missing PROPOSED_SERVICE_URL, failed to load Cerberus config", async () => {
    try {
      await getConfig();
      fail();
    } catch (err: any) {
      expect(err.message).toMatch("failed to load Cerberus config");
    }
  });

  test("missing PROPOSED_SERVICE_URL, Cerberus config missing upstream", async () => {
    const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), "cerberus-"));
    try {
      const confPath = path.join(tempdir, "cerberus.yaml");
      await fs.writeFile(confPath, "{}");
      process.env.CERBERUS_CONFIG_PATH = confPath;
      await getConfig();
      fail();
    } catch (err: any) {
      expect(err.message).toMatch("failed to determine proposed service URL");
    } finally {
      await fs.rm(tempdir, { force: true, recursive: true });
    }
  });

  test("minimum configuration", async () => {
    process.env["PROPOSED_SERVICE_URL"] = "http://localhost:8889";
    const config = await getConfig();
    expect(config.proposedBaseURL).toEqual("http://localhost:8889");
    expect(config.currentBaseURL).toBeUndefined();
    expect(config.listenPort).toEqual(30576);
  });

  test("everything configured", async () => {
    process.env["PROPOSED_SERVICE_URL"] = "http://localhost:8889";
    process.env["CURRENT_SERVICE_URL"] = "http://some-thing:8889";
    process.env["PORT"] = "9101";
    const config = await getConfig();
    expect(config.proposedBaseURL).toEqual("http://localhost:8889");
    expect(config.currentBaseURL).toEqual("http://some-thing:8889");
    expect(config.listenPort).toEqual(9101);
  });

  test("configured from Cerberus config upstream", async () => {
    const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), "cerberus-"));
    try {
      const confPath = path.join(tempdir, "cerberus.yaml");
      await fs.writeFile(
        confPath,
        `{"upstream": {"address": "http://localhost:9999"}}`,
      );
      process.env.CERBERUS_CONFIG_PATH = confPath;
      const config = await getConfig();
      expect(config.proposedBaseURL).toEqual("http://localhost:9999");
    } finally {
      await fs.rm(tempdir, { force: true, recursive: true });
    }
  });
});
