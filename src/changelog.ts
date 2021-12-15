import {
  parseOpenAPIWithSourcemap,
  sourcemapReader,
} from "@useoptic/openapi-io";
import type { JsonSchemaSourcemap } from "@useoptic/openapi-io";
import {
  factsToChangelog,
  IChange,
  OpenApiFact,
  OpenAPITraverser,
  OpenAPIV3,
} from "@useoptic/openapi-utilities";

const yargs = require("yargs");
import { hideBin } from "yargs/helpers";

export type ParseOpenAPIResult = {
  jsonLike: OpenAPIV3.Document;
  sourcemap: JsonSchemaSourcemap;
};

const parseOpenAPI = async (path: string): Promise<ParseOpenAPIResult> => {
  return await parseOpenAPIWithSourcemap(path);
};

export async function changeLogBetween(
  from: OpenAPIV3.Document,
  to: OpenAPIV3.Document,
): Promise<IChange<OpenApiFact>[]> {
  const currentTraverser = new OpenAPITraverser();
  currentTraverser.traverse(from);
  const currentFacts = currentTraverser.accumulator.allFacts();

  const nextTraverser = new OpenAPITraverser();
  nextTraverser.traverse(to);
  const nextFacts = nextTraverser.accumulator.allFacts();

  return factsToChangelog(currentFacts, nextFacts);
}

export const main = async () => {
  const argv = yargs(hideBin(process.argv)).argv;
  if (!argv.from || !argv.to) {
    throw new Error("usage: --from <from> --to <to>");
  }
  const fromSpec = await parseOpenAPI(argv.from);
  const toSpec = await parseOpenAPI(argv.to);
  const delta = await changeLogBetween(fromSpec.jsonLike, toSpec.jsonLike);

  console.log(JSON.stringify(delta, null, 2));
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
