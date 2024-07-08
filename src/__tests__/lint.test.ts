import * as os from "os";
import * as uuid from "uuid";
import { lintAction } from "../lint";

// Tests which spawn subprocesses seem to take longer to execute in CircleCI
const testTimeout = 60000;

jest.useRealTimers();

describe("lint command", () => {
  let pushd: string;
  beforeEach(async () => {
    pushd = process.cwd();
    process.chdir(__dirname + "/../..");
  });
  afterEach(async () => {
    process.chdir(pushd);
  });

  it(
    "can lint with path given",
    async () => {
      await lintAction("end-end-tests/api-standards/resources");
    },
    testTimeout,
  );

  it(
    "can lint with path and branch given",
    async () => {
      await lintAction("end-end-tests/api-standards/resources", "main");
    },
    testTimeout,
  );

  it(
    "can lint with with --compare-to",
    async () => {
      process.chdir("end-end-tests/api-standards");
      await lintAction(undefined, undefined, {
        compareTo: "HEAD",
      });
    },
    testTimeout,
  );

  it(
    "can lint with .vervet.yaml",
    async () => {
      // cd to location where a .vervet.yaml will be found
      process.chdir("end-end-tests/api-standards");
      await lintAction();
    },
    testTimeout,
  );

  it(
    "can lint with .vervet.yaml exclusions - no files detected",
    async () => {
      // cd to location where a .vervet.yaml will be found
      process.chdir("end-end-tests/exclusions");
      await lintAction();
    },
    testTimeout,
  );

  it("errors with invalid branch given", async () => {
    try {
      await lintAction(
        "end-end-tests/api-standards/resources",
        // a branch that should not exist
        "no-such-branch-" + uuid.v4(),
      );
      throw new Error("should have thrown an error");
    } catch (err: any) {
      expect(err.message).toContain("fatal: Not a valid object name");
    }
  });

  it("errors when .vervet.yaml cannot be found", async () => {
    // cd to where no .vervet.yaml will be found
    process.chdir(os.tmpdir());
    try {
      await lintAction();
      throw new Error("should have thrown an error");
    } catch (err: any) {
      expect(err.message).toContain(
        "cannot find .vervet.yaml -- is this a Vervet-managed API project?",
      );
    }
  });
});
