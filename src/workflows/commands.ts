import { Command, Argument } from "commander";
import { addOperation, createResource } from "./actions";

export function createResourceCommand() {
  const command = new Command("create-resource")
    .addArgument(new Argument("<resource-name>", "[resource-name]"))
    .addArgument(
      new Argument("<plural-resource-name>", "[plural-resource-name]"),
    )
    .action(async (resourceName, pluralResourceName) => {
      return createResource(resourceName, pluralResourceName);
    });

  command.description("create a new resource");

  return command;
}

export function addOperationCommand() {
  const command = new Command("add-operation")
    .addArgument(new Argument("<openapi>", "path to openapi file"))
    .addArgument(new Argument("<operation>", "[operation]"))
    .addArgument(new Argument("<resource-name>", "[resource-name]"))
    .addArgument(
      new Argument("<plural-resource-name>", "[plural-resource-name]"),
    )
    .action(
      async (specFilePath, operation, resourceName, pluralResourceName) => {
        return addOperation(
          specFilePath,
          operation,
          resourceName,
          pluralResourceName,
        );
      },
    );

  command.description("add an operation to an existing resource");

  return command;
}
