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
    .map(mapLocaleData(new RegExp(`\.(${opts.localeRegionExp})\.json$`)))
    .reduce(mergeContexts(opts.contextDelimiterKeys), {});

  // Check for extra keys and invalid locales from the top level contexts
  Object.entries(localeData)
    .filter(([key]) => key.split(opts.contextDelimiterKeys).length === 1)
    .forEach(([key, locales]) => {
      Object.entries(locales).forEach(([localeId, messages]) => {
        if (
          localeId !== opts.baseLanguage &&
          localeData[key][opts.baseLanguage]
        ) {
          Object.keys(messages).forEach((messageId) => {
            if (!(messageId in localeData[key][opts.baseLanguage])) {
              logger.warn(
                `Extra Keys: ${messageId} found in ${localeId} but not in the default language`
              );
            }
          });
        }
      });
    });

  return Object.entries(localeData)
    .filter(([key, locales]) => {
      if (!locales[opts.baseLanguage]) {
        logger.warn(`Could not find default locale contents for ${key}.`);
        return false;
      }
      return true;
    })
    .map(mergeDefaultKeys(opts.baseLanguage));
};
