const camelCaseRegex = /^([a-z]+([A-Z][a-z]+)*)$/;

module.exports = (targetVal, opts, context) => {
  const re = new RegExp(opts.match);
  const result = targetVal.filter((item) => {
    return item[opts.field].match(re);
  });
  if (!result || result.length === 0) {
    return [
      {
        message: `Failed to find an object matching "${opts.field} =~ /${opts.match}/"`,
      },
    ];
  }
};
