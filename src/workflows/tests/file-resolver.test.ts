import path from "path";
import {
  resolveResourcesDirectory,
  resolveResourceVersion,
} from "../file-resolvers";

const testResourcesExamples = path.resolve(
  path.join(__dirname, "../../../end-end-tests/workflows/resources"),
);
const nonVervetProjectPath = path.resolve(
  path.join(__dirname, "../../../end-end-tests/simple-scenario"),
);

describe("file resolver", () => {
  it("can resolve when there is a resources dir", async () => {
    const resources = await resolveResourcesDirectory(testResourcesExamples);
    expect(
      resources && resources.endsWith("end-end-tests/workflows/resources"),
    ).toBeTruthy();
  });

  it("resolves by resource name and @latest ", async () => {
    const result = await tryLookup("users", "latest");
    expect("succeeded" in result).toBeTruthy();
    expect(pathFromResult(result)).toBe("/users/2022-03-21/spec.yaml");
  });

  it("resolves by resource name and @latest, when code is next to spec ", async () => {
    const result = await tryLookup("issues", "latest");
    expect("succeeded" in result).toBeTruthy();
    expect(pathFromResult(result)).toBe("/issues/2022-03-21/spec.yaml");
  });

  it("resolves by resource name and specific date ", async () => {
    const result = await tryLookup("users", "2022-03-21");
    expect("succeeded" in result).toBeTruthy();
    expect(pathFromResult(result)).toBe("/users/2022-03-21/spec.yaml");
  });

  it("will not resolve resource name that does not exist", async () => {
    const result = await tryLookup("not-real", "latest");
    expect("failed" in result).toBeTruthy();
  });

  it("will not resolve date version that does not exist", async () => {
    const result = await tryLookup("issues", "2020-01-01");
    expect("failed" in result).toBeTruthy();
  });

  it("will not resolve outside of a vervet project", async () => {
    const resources = await resolveResourcesDirectory(nonVervetProjectPath);
    expect(resources).toBeFalsy();
  });

  it("will not resolve a non-existent path", async () => {
    const resources = await resolveResourcesDirectory("/no/such/place");
    expect(resources).toBeFalsy();
  });
});

async function tryLookup(resourceName: string, version: string) {
  return resolveResourceVersion(testResourcesExamples, resourceName, version);
}

function pathFromResult(result: any): string {
  return result.succeeded.path.split(testResourcesExamples)[1];
}
