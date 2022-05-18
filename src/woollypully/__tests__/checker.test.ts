import * as fs from "fs";
import * as path from "path";

import * as axios from "axios";
import { loadSpecFromUrl, dereferenceOpenAPI } from "@useoptic/openapi-io";

import { Checker } from "../checker";

import { Config } from "../config";

jest.mock("axios");
jest.mock("@useoptic/openapi-io");

const defaultApis = {
  apis: [
    {
      path: "/rest",
      type: "openapi",
      visibility: "public",
    },
  ],
};
const defaultVersions = ["2022-05-23~beta"];
const defaultSpecJson = fs.readFileSync(
  path.join(
    __dirname,
    "static_readiness_ok",
    "fake-service",
    "versions",
    "2022-05-23~beta",
    "spec.json",
  ),
);

describe("checker", () => {
  beforeEach(() => {
    delete process.env.PROPOSED_SERVICE_URL;
    delete process.env.CURRENT_SERVICE_URL;
    delete process.env.PORT;
    process.env.PROPOSED_SERVICE_URL = "http://example.com";
  });

  test("can check APIs", async () => {
    (axios.default.create as jest.Mock).mockImplementation(() => ({
      get: jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({ data: defaultApis, status: 200 }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ data: defaultVersions, status: 200 }),
        ),
    }));
    (loadSpecFromUrl as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        flattened: dereferenceOpenAPI(JSON.parse(defaultSpecJson.toString())),
      }),
    );
    const checker = new Checker(new Config());
    try {
      await checker.checkApis();
    } catch (err: any) {
      fail(err.message);
    }
  });

  test("fails if service is unavailable", async () => {
    (axios.default.create as jest.Mock).mockImplementation(() => ({
      get: jest
        .fn()
        .mockImplementation(() => Promise.reject(new Error("bad wolf"))),
    }));
    const checker = new Checker(new Config());
    try {
      await checker.checkApis();
      fail();
    } catch (err: any) {
      expect(err.message).toMatch("bad wolf");
    }
  });

  test.each([400, 404, 500])(
    "fails if apis request responds with %s",
    async (status) => {
      (axios.default.create as jest.Mock).mockImplementation(() => ({
        get: jest
          .fn()
          .mockImplementationOnce(() =>
            Promise.resolve({ data: defaultApis, status: status }),
          ),
      }));
      const checker = new Checker(new Config());
      try {
        await checker.checkApis();
        fail("expected error");
      } catch (err: any) {
        expect(err.message).toMatch("failed to obtain APIs");
      }
    },
  );

  test.each([400, 404, 500])(
    "fails if versions request responds with %s",
    async (status) => {
      (axios.default.create as jest.Mock).mockImplementation(() => ({
        get: jest
          .fn()
          .mockImplementationOnce(() =>
            Promise.resolve({ data: defaultApis, status: 200 }),
          )
          .mockImplementationOnce(() =>
            Promise.resolve({ data: defaultVersions, status: status }),
          ),
      }));
      const checker = new Checker(new Config());
      try {
        await checker.checkApis();
        fail("expected error");
      } catch (err: any) {
        expect(err.message).toMatch("failed to obtain OpenAPI versions");
      }
    },
  );

  test("fails if spec request fails", async () => {
    (axios.default.create as jest.Mock).mockImplementation(() => ({
      get: jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({ data: defaultApis, status: 200 }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ data: defaultVersions, status: 200 }),
        ),
    }));
    (loadSpecFromUrl as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("bad wolf")),
    );
    const checker = new Checker(new Config());
    try {
      await checker.checkApis();
      fail("expected error");
    } catch (err: any) {
      expect(err.message).toMatch("bad wolf");
    }
  });

  test("fails if spec is invalid", async () => {
    (axios.default.create as jest.Mock).mockImplementation(() => ({
      get: jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({ data: defaultApis, status: 200 }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ data: defaultVersions, status: 200 }),
        ),
    }));
    (loadSpecFromUrl as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        flattened: 42,
      }),
    );
    const checker = new Checker(new Config());
    try {
      await checker.checkApis();
      fail("expected error");
    } catch (err: any) {
      expect(err.message).toBeTruthy();
    }
  });
});
