const pluralize = require("pluralize");

// Here's your escape hatch to customize plural rules for your domain
// https://www.npmjs.com/package/pluralize#usage

// pluralize.addUncountableRule("snyk"); // no way to make this plural
// pluralize.addPluralRule("bacterium", "bacteria");

export function isPluralResourceName(
  name: string,
): { passes: true } | { passes: false; plural: string } {
  if (pluralize.isPlural(name)) {
    return { passes: true };
  } else {
    return { passes: false, plural: pluralize.plural(name, 2) };
  }
}
