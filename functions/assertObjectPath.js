const camelCaseRegex = /^([a-z]+([A-Z][a-z]+)*)$/;

module.exports = (targetVal, opts, context) => {
  for (var i = 0; i < opts.path.length; i++) {
    targetVal = targetVal[opts.path[i]];
    if (!targetVal) {
      break;
    }
  }
  if (!targetVal) {
    return [
      {
        message: `${opts.path.join('.')} not defined`,
      },
    ];
  }
};
