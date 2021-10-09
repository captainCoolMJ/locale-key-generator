const path = require("path");
const fs = require("fs");
const defaultConfig = require("./config.json");
const logger = require("./src/logger");
const prepareLocaleData = require("./src/prepare-locale-data");
const getLocaleFiles = require("./src/get-locale-files");
const { traverse } = require("./src/utils");

const getLocaleData = (opts, logger) =>
  prepareLocaleData(
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
  build: (opts = {}) => {
    opts = { ...defaultConfig, ...opts };

    if (!opts.dryRun && !fs.existsSync(path.resolve(opts.outputPath))) {
      fs.mkdirSync(path.resolve(opts.outputPath), { recursive: true });
    }

    Object.entries(getLocaleData(opts, logger)).forEach(
      ([contextGroup, localeData]) => {
        const outputFilePath = path.resolve(
          opts.outputPath,
          contextGroup.replace(
            new RegExp(`\\${opts.contextDelimiterKeys}`, "g"),
            opts.contextDelimiterFiles
          )
        );

        Object.entries(localeData).forEach(([locale, contents]) => {
          const path = `${outputFilePath}.${locale}.json`;
          if (!opts.dryRun) {
            fs.writeFileSync(path, JSON.stringify(contents, null, "\t"));
          }
          logger.info("Wrote", path);
        });
      }
    );
  },
  lint: (opts = {}) => {
    opts = { ...defaultConfig, ...opts };

    getLocaleData(opts, logger);

    if (logger.getWarnCount() > 0) {
      throw new Error("There was a problem. See log above for details");
    }

    console.log(
      "TODO: Provide warnings if keys are not in ICU message format structure"
    );

    logger.success("Wow great job! You're good to go");
  },
};
