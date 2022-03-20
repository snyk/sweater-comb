import chalk from "chalk";

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
