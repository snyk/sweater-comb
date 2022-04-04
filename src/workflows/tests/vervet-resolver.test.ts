import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { loadVervetResoucePaths } from "../vervet-resolver";

describe("vervet resolver", () => {
  const originalwd = process.cwd();
  let tmpDir = "";

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "foo-"));
    fs.writeFileSync(
      path.join(tmpDir, ".vervet.yaml"),
      `
apis:
  testapi:
    resources:
      - path: 'src/testapi/something/something/resources'
      - path: 'src/testapi/something-else/something-else/resources'
  testapi2:
    resources:
      - path: 'src/testapi2/resources'
`,
    );
  });

  afterEach(() => {
    process.chdir(originalwd);
    if (tmpDir !== "") {
      fs.rmSync(tmpDir, { force: true, recursive: true });
    }
  });

  it("chooses the first resource path in the first API", async () => {
    // arrange
    process.chdir(tmpDir);
    // act
    const vervetPaths = await loadVervetResoucePaths();
    // assert
    expect(vervetPaths?.defaultResourcesPath).toMatch(
      new RegExp(".*src/testapi/something/something/resources$"),
    );
  });

  it("works from a subdirectory in the same project", async () => {
    // arrange
    const otherDir = path.join(tmpDir, "other-place");
    fs.mkdirSync(otherDir);
    process.chdir(otherDir);
    // act
    const vervetPaths = await loadVervetResoucePaths();
    // assert
    expect(vervetPaths?.defaultResourcesPath).toMatch(
      new RegExp(".*src/testapi/something/something/resources$"),
    );
  });

  it("requires a vervet config", async () => {
    // arrange
    process.chdir(tmpDir);
    fs.unlinkSync(".vervet.yaml");
    // act
    const vervetPaths = await loadVervetResoucePaths();
    // assert
    expect(vervetPaths).toBeFalsy();
  });

  it("requires an api to be defined", async () => {
    // arrange
    process.chdir(tmpDir);
    fs.writeFileSync(".vervet.yaml", "apis: {}");
    // act
    const vervetPaths = await loadVervetResoucePaths();
    // assert
    expect(vervetPaths).toBeFalsy();
  });

  it("requires a valid vervet config", async () => {
    // arrange
    process.chdir(tmpDir);
    fs.writeFileSync(".vervet.yaml", "}}}bad wolf{{{");
    // act
    const vervetPaths = await loadVervetResoucePaths();
    // assert
    expect(vervetPaths).toBeFalsy();
  });

  it("requires target directory to exist", async () => {
    // arrange
    process.chdir(tmpDir);
    // act
    const vervetPaths = await loadVervetResoucePaths("/does-not-exist");
    // assert
    expect(vervetPaths).toBeFalsy();
  });

  it("requires apis to declare resources", async () => {
    // arrange
    process.chdir(tmpDir);
    fs.writeFileSync(".vervet.yaml", "apis: {foo: {}}");
    // act
    const vervetPaths = await loadVervetResoucePaths("/does-not-exist");
    // assert
    expect(vervetPaths).toBeFalsy();
  });
});
