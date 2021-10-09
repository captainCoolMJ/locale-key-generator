const path = require("path");
const fs = require("fs");

module.exports = {
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
  filterBlacklist:
    (blacklist) =>
    ({ file }) =>
      !blacklist.includes(file),
  filterMatchingFiles:
    (logger, matcher) =>
    ({ parts }) => {
      if (parts.some((part) => !matcher.test(part))) {
        logger.warn(`Invalid Name: "${parts.join("/")}" is not valid"`);
        return false;
      }
      return true;
    },
  mapContextData: (delimiter) => (file) => {
    const parts = file.parts.map((part) => part.split(".")[0]);
    return {
      ...file,
      contexts: parts,
      key: parts.join(delimiter),
    };
  },
  filterWhitelistedContexts:
    (whitelist, delimiter) =>
    ({ key }) =>
      whitelist
        ? whitelist.some(
            (ctx) => key === ctx || key.startsWith(`${ctx}${delimiter}`)
          )
        : true,
  dropInvalidKeys: (logger, matcher) => (file) => ({
    ...file,
    content: Object.entries(file.content).reduce((content, [key, value]) => {
      if (!matcher.test(key)) {
        logger.warn(`Invalid Message Key: ${key} found in ${file.path}`);
        return content;
      }
      content[key] = value;
      return content;
    }, {}),
  }),
  prefixContentKeys: (delimiter) => (file) => ({
    ...file,
    content: Object.entries(file.content).reduce((prefixed, [key, value]) => {
      prefixed[`${file.key}${delimiter}${key}`] = value;
      return prefixed;
    }, {}),
  }),
};
