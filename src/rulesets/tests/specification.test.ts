import { rules } from "../specification";
import { SynkApiCheckContext } from "../../dsl";

import { createSnykTestFixture } from "./fixtures";
const { compare } = createSnykTestFixture();

const emptyContext: SynkApiCheckContext = {
  changeDate: "2021-10-10",
  changeResource: "Example",
  changeVersion: {
    date: "2021-10-10",
    stability: "ga",
  },
  resourceVersions: {},
};
