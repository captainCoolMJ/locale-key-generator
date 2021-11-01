const path = require("path");
const fs = require("fs");

module.exports = {
  // Traverse a fs directory and return data about all the files inside it
  traverse: (basePath) => {
    const traverse = (startDir, ret = []) => {
      fs.readdirSync(startDir).forEach((file) => {
        const fullPath = path.resolve(".", startDir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
          traverse(fullPath, ret);
        } else {
          ret.push({
            path: fullPath,
            parts: fullPath
              .split(path.resolve(".", basePath))[1]
              .split("/")
              .slice(1),
            file: file,
          });
        }
      });
      return ret;
    };
    return traverse;
  },
  // Drop any "ignored" files
  filterBlacklist:
    (blacklist) =>
    ({ file }) =>
      !blacklist.includes(file),
  // Ensure only matching locale files get processed and log a warning if there are non matches
  filterMatchingFiles:
    (logger, matcher) =>
    ({ parts }) => {
      if (parts.some((part) => !matcher.test(part))) {
        logger.warn(`Invalid Name: "${parts.join("/")}" is not valid`);
        return false;
      }
      return true;
    },
  // Attach context data
  mapContextData: (delimiter) => (file) => {
    const parts = file.parts.map((part) => part.split(".")[0]);
    return {
      ...file,
      contexts: parts,
      key: parts.join(delimiter),
    };
  },
  // Attach locale data
  mapLocaleData: (matcher, defaultLocale) => (file) => ({
    ...file,
    locale: file.file.match(matcher)?.[1] || defaultLocale,
  }),
  // Apply the contents of a file to each locale and context it applies to
  mergeContexts: (delimiter) => (contexts, file) => {
    file.contexts.forEach((context, i) => {
      const key = file.contexts.slice(0, i + 1).join(delimiter);
      contexts[key] = contexts[key] || {};
      contexts[key][file.locale] = {
        ...contexts[key][file.locale],
        ...file.content,
      };
    });
    return contexts;
  },
  // Ensure all locales have the same keys as the default
  mergeDefaultKeys: (defaultLocale) => (context) => {
    const [, locales] = context;
    Object.entries(locales).forEach(([locale, contents]) => {
      locales[locale] = {
        ...locales[defaultLocale],
        ...contents,
      };
    });
    return context;
  },
  // Ensure only supplied contexts get processed
  filterWhitelistedContexts:
    (whitelist, delimiter) =>
    ({ key }) =>
      whitelist
        ? whitelist.some(
            (ctx) => key === ctx || key.startsWith(`${ctx}${delimiter}`)
          )
        : true,
  // Remove keys with invalid naming pattern and log warning
  dropInvalidKeys: (logger, matcher) => (file) => ({
    ...file,
    content: Object.entries(file.content).reduce((content, [key, value]) => {
      if (!matcher.test(key)) {
        logger.warn(`Invalid Message Key: "${key}" found in ${file.path}`);
        return content;
      }
      content[key] = value;
      return content;
    }, {}),
  }),
  // Prefix keys with the context they belong to
  prefixContextKeys: (delimiter) => (file) => ({
    ...file,
    content: Object.entries(file.content).reduce((prefixed, [key, value]) => {
      prefixed[`${file.key}${delimiter}${key}`] = value;
      return prefixed;
    }, {}),
  }),
  // Map context and locale data to a file path
  mapContextToFile:
    (keyDelimiter, fileDelimiter, filenameSuffix = "") =>
    ([context, localeContents]) => ({
      localeContents: localeContents,
      file: `${context.replace(
        new RegExp(`\\${keyDelimiter}`, "g"),
        fileDelimiter
      )}${filenameSuffix}`,
    }),
  // Write locale data to file
  writeLocalesToFile:
    (logger, dryRun) =>
    ({ file, localeContents }) => {
      Object.entries(localeContents).forEach(([locale, localeContents]) => {
        const path = `${file}.${locale}.json`;
        if (!dryRun) {
          fs.writeFileSync(path, JSON.stringify(localeContents, null, "\t"));
        }
        logger.info(`${dryRun ? "Would have written" : "Wrote"} "${path}"`);
      });
    },
};
