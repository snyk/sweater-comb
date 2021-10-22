const path = require('path');
const fs = require('fs');
const Module = require('module');
const { migrateRuleset } = require('@stoplight/spectral-ruleset-migrator');

const loadRules = async (ruleFile) => {
  if (!ruleFile) {
    ruleFile = '.spectral.yaml';
  }
  const rulesetFile = path.join(__dirname, '..', ruleFile);
  const rulesetSrc = await migrateRuleset(rulesetFile, {
    format: 'commonjs',
    fs,
  });
  const m = new Module('', module.parent);
  m.paths = Module._nodeModulePaths('');
  m._compile(rulesetSrc, 'ruleset.loaded.js');
  return m.exports;
};

const loadSpec = (filePath) => {
  return fs.readFileSync(path.join(__dirname, filePath)).toString();
};

function getAllErrors(errors, errorCode = '') {
  if (!Array.isArray(errors)) return [];

  return errors.filter((item) => item.code && item.code === errorCode);
}

module.exports = {
  loadRules,
  loadSpec,
  getAllErrors,
};
