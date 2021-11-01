const {
  dropInvalidKeys,
  prefixContextKeys,
  mapLocaleData,
  mergeContexts,
  mergeDefaultKeys,
  mapValues,
} = require("./utils");

module.exports = (fileData, opts, logger) => {
  const localeData = fileData
    .map(dropInvalidKeys(logger, new RegExp(`^${opts.keyMatchExp}$`)))
    .map(mapValues(logger))
    .map(prefixContextKeys(opts.contextDelimiterKeys))
    .map(
      mapLocaleData(
        new RegExp(`\.(${opts.localeRegionExp})\.json$`),
        opts.defaultLocale
      )
    )
    .reduce(mergeContexts(opts.contextDelimiterKeys), {});

  // Check for extra keys from the top level contexts
  Object.entries(localeData)
    .filter(([key]) => key.split(opts.contextDelimiterKeys).length === 1)
    .forEach(([key, locales]) => {
      Object.entries(locales).forEach(([localeId, messages]) => {
        if (localeId !== opts.defaultLocale) {
          Object.keys(messages).forEach((messageId) => {
            if (!(messageId in localeData[key][opts.defaultLocale])) {
              logger.warn(
                `Extra Keys: ${messageId} found in ${localeId} but not in the default language`
              );
            }
          });
        }
      });
    });

  return Object.entries(localeData).map(mergeDefaultKeys(opts.defaultLocale));
};
