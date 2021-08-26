const path = require('path');
const fs = require('fs');
const Module = require('module');
const { migrateRuleset } = require('@stoplight/spectral-ruleset-migrator');

const loadRules = async () => {
  const rulesetFile = path.join(__dirname, '..', 'ruleset.yaml');
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

module.exports = {
  loadRules,
  loadSpec,
};
