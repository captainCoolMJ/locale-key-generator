const path = require("path");
const fs = require("fs");

const readJSONFile = (path) =>
  JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));

const getMatchingFiles = (startDir, ret = [], fileMatcher) => {
  fs.readdirSync(startDir).forEach((file) => {
    if (!file.match(fileMatcher)) {
      return;
    }

    const fileName = path.join(startDir, file);

    if (fs.lstatSync(fileName).isDirectory()) {
      getMatchingFiles(fileName, ret, fileMatcher);
    } else {
      ret.push({
        path: fileName,
        contents: readJSONFile(fileName),
      });
    }
  });

  return ret;
};

module.exports = {
  getMatchingFiles,
  extractContexts: (files, startPath, localeRegionExp) => {
    return files.map((file) => ({
      ...file,
      contexts: file.path
        .split(path.resolve(startPath))[1]
        .split(new RegExp(`.${localeRegionExp}|\.json`))[0]
        .split("/")
        .slice(1),
    }));
  },
  extractLocaleContent: (
    filesWithContexts,
    { nameMatchExp, localeRegionExp, contextDelimiterKeys }
  ) => {
    const contexts = {};
    filesWithContexts.forEach((file) => {
      const lang =
        file.path.match(
          new RegExp(`${nameMatchExp}\.(${localeRegionExp})\.json$`)
        )?.[1] || "default";

      file.contexts.forEach((context, i) => {
        const key =
          file.contexts.slice(0, i + 1).join(contextDelimiterKeys) || "default";
        contexts[key] = contexts[key] || {};
        contexts[key][lang] = {
          ...contexts[key][lang],
          ...Object.entries(file.contents).reduce((acc, [messageId, value]) => {
            acc[
              `${file.contexts.join(
                contextDelimiterKeys
              )}${contextDelimiterKeys}${messageId}`
            ] = value;
            return acc;
          }, {}),
        };
      });
    });
    return contexts;
  },
  mergeLocaleGroups: (localeData) =>
    Object.entries(localeData).reduce((acc, [key, availableLocales]) => {
      const { default: base, ...languages } = availableLocales;

      acc[key] = acc[key] || {};
      acc[key].default = base;

      Object.entries(languages).forEach(([langCode, contents]) => {
        acc[key][langCode] = {
          ...base,
          ...contents,
        };
      });

      return acc;
    }, {}),
};
