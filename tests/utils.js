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

const loadOneRule = async (ruleFile, ruleName) => {
  const rules = await loadRules(ruleFile);

  const { [ruleName]: rule } = rules.rules;

  return rule;
};

const loadSpec = (filePath) => {
  return fs.readFileSync(path.join(__dirname, filePath)).toString();
};

const specFactory = ({ paths = {}, components = {}, tags = [] } = {}) => {
  return {
    info: {
      title: 'Registry',
      version: '3.0.0',
    },
    openapi: '3.0.3',
    servers: [
      {
        description: 'Snyk Registry',
        url: '/api/v3',
      },
    ],
    tags: [...tags],
    components: { ...components },
    paths: { ...paths },
  };
};

module.exports = {
  specFactory,
  loadRules,
  loadOneRule,
  loadSpec,
};
