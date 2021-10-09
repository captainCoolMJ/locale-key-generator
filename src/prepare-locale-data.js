const { dropInvalidKeys, prefixContentKeys } = require("./utils");

module.exports = (fileData, opts, logger) => {
  const localeData = fileData
    .map(dropInvalidKeys(logger, new RegExp(`^${opts.keyMatchExp}$`)))
    .map(prefixContentKeys(opts.contextDelimiterKeys))
    .reduce((contexts, fileData) => {
      const { parts, file, content } = fileData;
      const lang =
        file.match(new RegExp(`\.(${opts.localeRegionExp})\.json$`))?.[1] ||
        opts.defaultLocale;

      parts.forEach((part, i) => {
        const key = parts
          .map((part) => part.split(".")[0])
          .slice(0, i + 1)
          .join(opts.contextDelimiterKeys);
        contexts[key] = contexts[key] || {};
        contexts[key][lang] = {
          ...contexts[key][lang],
          ...Object.entries(content).reduce((acc, [messageId, value]) => {
            acc[messageId] = value;
            return acc;
          }, {}),
        };
      });
      return contexts;
    }, {});

  // Check for extra keys from the top level contexts
  Object.entries(localeData).forEach(([key, locales]) => {
    if (key.split(opts.contextDelimiterKeys).length === 1) {
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
    }
  });

  return Object.entries(localeData).reduce((acc, [key, locales]) => {
    acc[key] = acc[key] || {};
    Object.entries(locales).forEach(([langCode, contents]) => {
      acc[key][langCode] = {
        ...locales[opts.defaultLocale],
        ...contents,
      };
    });
    return acc;
  }, {});
};
