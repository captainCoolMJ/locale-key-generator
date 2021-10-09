const {
  filterBlacklist,
  filterWhitelistedContexts,
  filterMatchingFiles,
  mapContextData,
} = require("./utils");

module.exports = (filesList, opts, logger) =>
  filesList
    .map(mapContextData(opts.contextDelimiterKeys))
    .filter(filterBlacklist(opts.ignoreFiles))
    .filter(
      filterWhitelistedContexts(
        opts.contexts?.split(","),
        opts.contextDelimiterKeys
      )
    )
    .filter(
      filterMatchingFiles(
        logger,
        new RegExp(`^${opts.keyMatchExp}(\.${opts.localeRegionExp})?(\.json)?$`)
      )
    );
