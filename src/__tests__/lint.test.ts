import * as os from "os";
import * as uuid from "uuid";
import { lintAction } from "../lint";

// Tests which spawn subprocesses seem to take longer to execute in CircleCI
const testTimeout = 30000;

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
      try {
        await lintAction("end-end-tests/api-standards/resources");
      } catch (err) {
        fail(err);
      }
    },
    testTimeout,
  );

  it(
    "can lint with path and branch given",
    async () => {
      try {
        await lintAction("end-end-tests/api-standards/resources", "main");
      } catch (err) {
        fail(err);
      }
    },
    testTimeout,
  );

  it(
    "can lint with .vervet.yaml",
    async () => {
      // cd to location where a .vervet.yaml will be found
      process.chdir("end-end-tests/api-standards");
      try {
        await lintAction();
      } catch (err) {
        fail(err);
      }
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
      fail("should have thrown an error");
    } catch (err: any) {
      expect(err.message).toContain(
        "bulk-compare end-end-tests/api-standards/resources failed with exit code 1",
      );
    }
  });

  it("errors when .vervet.yaml cannot be found", async () => {
    // cd to where no .vervet.yaml will be found
    process.chdir(os.tmpdir());
    try {
      await lintAction();
      fail("should have thrown an error");
    } catch (err: any) {
      expect(err.message).toContain(
        "cannot find .vervet.yaml -- is this a Vervet-managed API project?",
      );
    }
  });
});
