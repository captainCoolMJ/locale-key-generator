const path = require("path");
const fs = require("fs");

const traverse = (startDir, ret = []) => {
  fs.readdirSync(startDir).forEach((file) => {
    const fullPath = path.resolve(".", startDir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      traverse(fullPath, ret);
    } else {
      ret.push(fullPath);
    }
  });
  return ret;
};

module.exports = {
  traverse,
  mapJSONData: (file) => ({
    ...file,
    content: JSON.parse(fs.readFileSync(file.filePath, { encoding: "utf-8" })),
  }),
  filterBlacklist:
    (blacklist) =>
    ({ file }) =>
      !blacklist.includes(file),
  filterWhitelistedContexts:
    (whitelist, delimiter) =>
    ({ parts }) => {
      if (whitelist) {
        const keyPrefix = parts.join(delimiter);
        return whitelist.some((ctx) =>
          keyPrefix.startsWith(`${ctx}${delimiter}`)
        );
      }
      return true;
    },
  filterMatchingFiles:
    (logger, matcher) =>
    ({ parts }) => {
      if (parts.some((part) => !matcher.test(part))) {
        logger.warn(`Invalid Name: "${parts.join("/")}" is not valid"`);
        return false;
      }
      return true;
    },
  mapFileData: (basePath) => (filePath) => {
    const parts = filePath
      .split(path.resolve(".", basePath))[1]
      .split("/")
      .slice(1);
    return {
      filePath,
      parts,
      file: parts[parts.length - 1],
      fileName: parts[parts.length - 1].split(".")[0],
    };
  },
  dropInvalidKeys: (logger, matcher) => (file) => ({
    ...file,
    content: Object.entries(file.content).reduce((content, [key, value]) => {
      if (!matcher.test(key)) {
        logger.warn(`Invalid Message Key: ${key} found in ${file.filePath}`);
        return content;
      }
      content[key] = value;
      return content;
    }, {}),
  }),
  prefixContentKeys: (delimiter) => (file) => {
    const { parts } = file;
    const keyPrefix = parts.map((part) => part.split(".")[0]).join(delimiter);
    return {
      ...file,
      content: Object.entries(file.content).reduce((prefixed, [key, value]) => {
        prefixed[`${keyPrefix}${delimiter}${key}`] = value;
        return prefixed;
      }, {}),
    };
  },
};
