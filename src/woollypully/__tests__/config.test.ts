import { Config } from "../config";

describe("config", () => {
  beforeEach(() => {
    delete process.env.PROPOSED_SERVICE_URL;
    delete process.env.CURRENT_SERVICE_URL;
    delete process.env.PORT;
  });

  test("missing PROPOSED_SERVICE_URL", () => {
    expect(() => {
      new Config();
    }).toThrowError("missing PROPOSED_SERVICE_URL");
  });

  test("minimum configuration", () => {
    process.env["PROPOSED_SERVICE_URL"] = "http://localhost:8889";
    const config = new Config();
    expect(config.proposedBaseURL).toEqual("http://localhost:8889");
    expect(config.currentBaseURL).toBeUndefined();
    expect(config.listenPort).toEqual(30576);
  });

  test("everything configured", () => {
    process.env["PROPOSED_SERVICE_URL"] = "http://localhost:8889";
    process.env["CURRENT_SERVICE_URL"] = "http://some-thing:8889";
    process.env["PORT"] = "9101";
    const config = new Config();
    expect(config.proposedBaseURL).toEqual("http://localhost:8889");
    expect(config.currentBaseURL).toEqual("http://some-thing:8889");
    expect(config.listenPort).toEqual(9101);
  });
});
