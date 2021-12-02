const path = require("path");
const fs = require("fs");

const formatToJson = ({ file, localeContents }) =>
  Object.entries(localeContents).map(([localeCode, contents]) => ({
    path: `${file}.${localeCode}.json`,
    content: JSON.stringify(contents, null, "\t"),
  }));

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
    (logger, keyMatchExp, localeRegionExp, fileTypeExp) =>
    ({ parts, file }) => {
      let isValid = true;

      if (!new RegExp(`${localeRegionExp}\.${fileTypeExp}$`).test(file)) {
        isValid = false;
        logger.warn(
          `Invalid Locale: "${parts.join("/")}" is not a valid locale`
        );
      }

      if (
        parts.some(
          (part) => !new RegExp(`^${keyMatchExp}$`).test(part.split(".")[0])
        )
      ) {
        logger.warn(
          `Invalid File: "${parts.join("/")}" is not a valid file pattern`
        );
        isValid = false;
      }

      return isValid;
    },
  // Attach context data
  mapContextData: (delimiter, reservedContextFilename) => (file) => {
    const parts = file.parts.map((part) => part.split(".")[0]);
    if (
      reservedContextFilename &&
      parts[parts.length - 1] === reservedContextFilename
    ) {
      parts.splice(-1, 1);
    }
    return {
      ...file,
      contexts: parts,
      key: parts.join(delimiter),
    };
  },
  // Attach locale data
  mapLocaleData: (matcher) => (file) => ({
    ...file,
    locale: file.file.match(matcher)?.[1],
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
  mergeDefaultKeys: (baseLanguage) => (context) => {
    const [, locales] = context;
    Object.entries(locales).forEach(([locale, contents]) => {
      locales[locale] = {
        ...locales[baseLanguage],
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
  mapValues: (logger) => (file) => ({
    ...file,
    content: Object.entries(file.content).reduce((content, [key, value]) => {
      if (typeof value === "string") {
        content[key] = value;
      } else if (typeof value === "object" && "value" in value) {
        content[key] = value.value;
      } else {
        logger.warn(
          `Unsupported Message Structure for Key: "${key}" found in ${file.path}`
        );
      }
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
  formatToXliff:
    (baseLanguage) =>
    ({ file, localeContents }) =>
      Object.entries(localeContents).map(([localeCode, contents]) => {
        const defaultStrings = localeContents[baseLanguage];
        return {
          path: `${file}.${localeCode}.xml`,
          content: [
            '<xliff xmlns="urn:oasis:names:tc:xliff:document:1.2" version="1.2">',
            `<file source-language="${baseLanguage}" target-language="${localeCode}">`,
            "<body>",
            ...Object.entries(contents).map(([id, value]) =>
              [
                `\t<trans-unit id="${id}">`,
                `\t\t<source>${defaultStrings[id]}</source>`,
                `\t\t<target>${value}</target>`,
                "\t</trans-unit>",
              ].join("\n")
            ),
            "</body>",
            "</file>",
            "</xliff>",
          ].join("\n"),
        };
      }),
  formatToJson:
    () =>
    ({ file, localeContents }) =>
      Object.entries(localeContents).map(([localeCode, contents]) => ({
        path: `${file}.${localeCode}.json`,
        content: JSON.stringify(contents, null, "\t"),
      })),
};
