import { Command, Argument } from "commander";
import {
  addCreateOperationAction,
  addDeleteOperationAction,
  addGetOperationAction,
  addListOperationAction,
  addUpdateOperationAction,
  createResourceAction,
  promoteVersionAction,
  updateResourceAction,
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
    .addArgument(
      new Argument("<plural-resource-name>", "[plural-resource-name]"),
    )
    .addArgument(new Argument("[resource-version]", "version"))
    .action(async (pluralResourceName, resourceVersion) => {
      return action(pluralResourceName, resourceVersion);
    });

  command.description(description);

  return command;
}

export function createVersionCommand() {
  const command = new Command("version")
    .addArgument(new Argument("<resource-name>", "[resource-name]"))
    .addArgument(new Argument("<stability>", "stability"))

    .action(async (resourceName, stability) => {
      return promoteVersionAction(resourceName, stability);
    });

  command.description("create a new resource");

  return command;
}

export function createUpdateCommand() {
  const command = new Command("update")
    .addArgument(
      new Argument("<plural-resource-name>", "[plural-resource-name]"),
    )
    .addArgument(new Argument("[resource-version]", "version"))
    .action(async (pluralResourceName, resourceVersion) => {
      return updateResourceAction(pluralResourceName, resourceVersion);
    });

  command.description("update a resource schema from examples");

  return command;
}
