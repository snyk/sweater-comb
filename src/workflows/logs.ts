import chalk from "chalk";
import { ResourceVersionLookupResults } from "./file-resolvers";
import path from "path";

export function LogNoResourceDirectory() {
  console.log(
    chalk.red(
      `A Vervet resources directory can not be found in the working directory. You must be working from the parent or anywhere inside that directory to use sweater-comb generators`,
    ),
  );
}

export function LogDomainError(error: string) {
  console.log(chalk.red(error));
}
export function LogUpdatingSpecification(
  resource: string,
  version: string,
  filePath: string,
) {
  console.log(
    chalk.white(
      `updating OpenAPI description for: ${chalk.blue.bold(
        resource,
      )} ${chalk.green.bold(version)}`,
    ) + `\n   at ${filePath}:0:0\n`,
  );
}

export function LogNewDateVersionSpecification(
  resource: string,
  version: string,
  stability: string,
  filePath: string,
) {
  console.log(
    chalk.white(
      `new version and OpenAPI description for: ${chalk.blue.bold(
        resource,
      )} ${chalk.green.bold(version)} ${chalk.green.bold(stability)}`,
    ) + `\n   at ${filePath}:0:0\n`,
  );
}

export function AlreadyInSpec(method: string, path: string) {
  console.log(
    chalk.red(
      `Exiting. There is already an operation for ${chalk.bold(
        method,
      )} ${chalk.bold(path)}. Remove it and re-run the command to continue`,
    ),
  );
}

export function LogAddition(what: string, whereJsonPointer: string) {
  console.log(`   + ${chalk.bold(what)} at ${chalk.blue(whereJsonPointer)}`);
}

export function LogResourceVersionLookup(result: ResourceVersionLookupResults) {
  if ("succeeded" in result) {
    console.log(
      chalk.white(
        `updating OpenAPI description for: ${chalk.blue.bold(
          result.succeeded.matchedResource,
        )} ${chalk.green.bold(result.succeeded.matchedVersion)}`,
      ) + `\n   at ${result.succeeded.path}:0:0\n`,
    );
  } else if ("failed" in result) {
    if (
      result.failed.availableVersions.length ||
      (result.failed.availableResources.length &&
        result.failed.resourcesDirectory)
    ) {
      console.log(chalk.red("Matching resource version not found. "));
      if (!result.failed.matchedResource) {
        console.log(chalk.bold.blue("Available resources:"));
        console.log(
          result.failed.availableResources
            .map(
              (resource) =>
                `${chalk.bold(resource)}   ${chalk.gray(
                  path.relative(
                    path.resolve(result.failed.resourcesDirectory!, "../"),
                    path.join(result.failed.resourcesDirectory!, resource),
                  ),
                )}`,
            )
            .join("\n"),
        );
      }

      if (result.failed.matchedResource && !result.failed.matchedVersion) {
        console.log(chalk.bold.blue("Available date versions:"));
        console.log(
          result.failed.availableVersions
            .map(
              (version) =>
                `${chalk.bold(version)}   ${chalk.gray(
                  path.relative(
                    path.resolve(result.failed.resourcesDirectory!, "../"),
                    path.join(
                      result.failed.resourcesDirectory!,
                      result.failed.matchedResource!,
                      version,
                    ),
                  ),
                )}`,
            )
            .join("\n"),
        );
        console.log(
          chalk.gray(
            `\nor pass in '${chalk.white.bold("latest")}' for the most recent`,
          ),
        );
      }
    }
  }
}
