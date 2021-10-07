const path = require("path");
const fs = require("fs");
const {
  NAME_MATCH_EXP,
  LOCALE_REGION_EXP,
  FILE_TYPE_EXP,
} = require("./constants");

const readJSONFile = (path) =>
  JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));

const getMatchingFiles = (startDir, ret = [], matchExp) => {
  fs.readdirSync(startDir).forEach((file) => {
    if (!file.match(matchExp)) {
      return;
    }

    const fileName = path.join(startDir, file);

    if (fs.lstatSync(fileName).isDirectory()) {
      getMatchingFiles(fileName, ret, matchExp);
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
  extractLocaleContent: (files, startPath, matchExp) => {
    const withContext = files.map((file) => ({
      ...file,
      contexts: file.path
        .split(path.resolve(startPath))[1]
        .split(new RegExp(`.${LOCALE_REGION_EXP}|${FILE_TYPE_EXP}`))[0]
        .split("/")
        .slice(1),
    }));

    const contexts = {};
    withContext.forEach((file) => {
      const lang =
        file.path.match(
          new RegExp(
            `${NAME_MATCH_EXP}\.(${LOCALE_REGION_EXP})${FILE_TYPE_EXP}$`
          )
        )?.[1] || "default";

      file.contexts.forEach((context, i) => {
        const key = file.contexts.slice(0, i + 1).join(":") || "default";
        contexts[key] = contexts[key] || {};
        contexts[key][lang] = {
          ...contexts[key][lang],
          ...Object.entries(file.contents).reduce((acc, [messageId, value]) => {
            acc[`${file.contexts.join(":")}:${messageId}`] = value;
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
