const path = require("path");
const {
  traverse,
  mapFileData,
  filterBlacklist,
  filterWhitelistedContexts,
  filterMatchingFiles,
  mapJSONData,
} = require("./utils");

module.exports = (opts, logger) =>
  traverse(path.resolve(opts.inputPath))
    .map(mapFileData(opts.inputPath))
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
    )
    .map(mapJSONData);
