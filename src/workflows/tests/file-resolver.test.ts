import path from "path";
import { resolveResourcesDirectory } from "../file-resolvers";

const testResourcesExamples = path.resolve(
  path.join(__dirname, "../../../end-end-tests/workflows/resources"),
);

describe("vervet resolver", () => {
  it("can resolve when there is a resources dir", async () => {
    const resources = await resolveResourcesDirectory(testResourcesExamples);
    expect(
      resources.endsWith("end-end-tests/workflows/resources"),
    ).toBeTruthy();
  });
});
