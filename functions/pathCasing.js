const camelCaseRegex = /^([a-z]+([A-Z][a-z]+)*)$/;

module.exports = (targetVal, _opts, context) => {
  const parts = targetVal.replace(/[?].*/, '').split(/[/]/);
  const invalid = parts
    // Filter out empty string (leading path) and params (different rule)
    .filter((part) => part.length > 0 && !part.match(/^[{].*[}]/))
    .filter((part) => !part.match(camelCaseRegex));
  if (invalid.length > 0) {
    return [
      {
        message: `Path elements in "${targetVal}" are not camelCased: ${invalid.join(
          ', ',
        )}`,
      },
    ];
  }
};
