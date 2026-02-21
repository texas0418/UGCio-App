const { withInfoPlist } = require("@expo/config-plugins");

const withExportCompliance = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.ITSAppUsesNonExemptEncryption = false;
    return config;
  });
};

module.exports = withExportCompliance;
