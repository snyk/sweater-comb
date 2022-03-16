import { Command, Argument } from "commander";
import {
  addCreateOperationAction,
  addDeleteOperationAction,
  addGetOperationAction,
  addListOperationAction,
  addUpdateOperationAction,
  createResourceAction,
} from "./actions";

export function createResourceCommand() {
  const command = new Command("create-resource")
    .addArgument(new Argument("<resource-name>", "[resource-name]"))
    .addArgument(
      new Argument("<plural-resource-name>", "[plural-resource-name]"),
    )
    .action(async (resourceName, pluralResourceName) => {
      return createResourceAction(resourceName, pluralResourceName);
    });

  command.description("create a new resource");

  return command;
}

export const addCreateOperationCommand = buildOperationCommand(
  "add-create",
  "add a create operation to an existing resource",
  addCreateOperationAction,
);

export const addDeleteOperationCommand = buildOperationCommand(
  "add-delete",
  "add a delete operation to an existing resource",
  addDeleteOperationAction,
);

export const addGetOperationCommand = buildOperationCommand(
  "add-get",
  "add a get operation to an existing resource",
  addGetOperationAction,
);

export const addListOperationCommand = buildOperationCommand(
  "add-list",
  "add a list operation to an existing resource",
  addListOperationAction,
);

export const addUpdateOperationCommand = buildOperationCommand(
  "add-update",
  "add an update operation to an existing resource",
  addUpdateOperationAction,
);

function buildOperationCommand(name: string, description: string, action) {
  const command = new Command(name)
    .addArgument(new Argument("<openapi>", "path to openapi file"))
    .addArgument(new Argument("<resource-name>", "[resource-name]"))
    .addArgument(
      new Argument("<plural-resource-name>", "[plural-resource-name]"),
    )
    .action(async (specFilePath, resourceName, pluralResourceName) => {
      return action(specFilePath, resourceName, pluralResourceName);
    });

  command.description(description);

  return command;
}
