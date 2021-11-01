const path = require("path");
const fs = require("fs");
const defaultConfig = require("./config.json");
const logger = require("./src/logger");
const getLocalizedContexts = require("./src/get-localized-contexts");
const getLocaleFiles = require("./src/get-locale-files");
const {
  traverse,
  mapContextToFile,
  writeLocalesToFile,
} = require("./src/utils");

const buildContextsFromFs = (opts, logger) =>
  getLocalizedContexts(
    getLocaleFiles(
      traverse(opts.inputPath)(path.resolve(opts.inputPath)),
      opts,
      logger
    )
      .filter(({ file }) => file.endsWith(".json"))
      .map((file) => ({
        ...file,
        content: JSON.parse(fs.readFileSync(file.path, { encoding: "utf-8" })),
      })),
    opts,
    logger
  );

module.exports = {
  export: (opts = {}) => {
    opts = { ...defaultConfig, ...opts };

    if (!opts.dryRun && !fs.existsSync(path.resolve(opts.outputPath))) {
      fs.mkdirSync(path.resolve(opts.outputPath), { recursive: true });
    }

    buildContextsFromFs(opts, logger)
      .map(
        mapContextToFile(
          opts.contextDelimiterKeys,
          opts.contextDelimiterFiles,
          opts.filenameSuffix
        )
      )
      .map((file) => ({
        ...file,
        file: path.resolve(opts.outputPath, file.file),
      }))
      .forEach(writeLocalesToFile(logger, opts.dryRun));
  },
  lint: (opts = {}) => {
    opts = { ...defaultConfig, ...opts };

    buildContextsFromFs(opts, logger);

    if (logger.getWarnCount() > 0) {
      throw new Error("There was a problem. See log above for details");
    }

    console.log(
      "TODO: Provide warnings if keys are not in ICU message format structure"
    );

    logger.success("Wow great job! You're good to go");
  },
};
