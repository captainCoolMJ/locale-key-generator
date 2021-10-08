const path = require("path");
const fs = require("fs");
const {
  getMatchingFiles,
  extractLocaleContent,
  mergeLocaleGroups,
  extractContexts,
} = require("./src/utils");
const defaultConfig = require("./config.json");

module.exports = {
  build: (opts = {}) => {
    opts = { ...defaultConfig, ...opts };

    const whitelistedContexts = opts.contexts?.split(",");

    const matchExp = new RegExp(
      `^${opts.nameMatchExp}(\.${opts.localeRegionExp})?(\.json)?$`
    );

    const localeFiles = getMatchingFiles(
      path.resolve(opts.inputPath),
      [],
      matchExp
    );

    const filesWithContexts = extractContexts(
      localeFiles,
      opts.inputPath,
      opts.localeRegionExp
    ).filter((file) => {
      if (whitelistedContexts) {
        const context = file.contexts.join(opts.contextDelimiterKeys);
        return whitelistedContexts.some((ctx) => context.startsWith(ctx));
      }
      return true;
    });

    const localeData = extractLocaleContent(filesWithContexts, {
      contextDelimiterKeys: opts.contextDelimiterKeys,
      nameMatchExp: opts.nameMatchExp,
      localeRegionExp: opts.localeRegionExp,
    });

    const merged = mergeLocaleGroups(localeData);

    if (!fs.existsSync(path.resolve(opts.outputPath))) {
      fs.mkdirSync(path.resolve(opts.outputPath), { recursive: true });
    }

    Object.entries(merged).forEach(([contextGroup, localeData]) => {
      const outputFilePath = path.resolve(
        opts.outputPath,
        contextGroup.replace(
          new RegExp(`\\${opts.contextDelimiterKeys}`, "g"),
          opts.contextDelimiterFiles
        )
      );

      Object.entries(localeData).forEach(([locale, contents]) => {
        let path = outputFilePath;
        if (locale !== "default") {
          path += `.${locale}`;
        }
        path += ".json";

        fs.writeFileSync(path, JSON.stringify(contents, null, "\t"));
      });
    });
  },
  lint: (opts = {}) => {
    opts = { ...defaultConfig, ...opts };

    const matchExp = new RegExp(
      `^${opts.nameMatchExp}(\.${opts.localeRegionExp})?(\.json)?$`
    );

    console.log("TODO: Provide warnings if duplicate keys are encountered");
    console.log(
      "TODO: Provide warnings if keys are not in ICU message format structure"
    );
    console.log("TODO: Provide warnings if invalid file names are encountered");
    console.log("TODO: Provide warnings if file names do not use snake case");
    console.log("TODO: Provide warnings if keys do not use snake case");
    console.log(
      "TODO: Provide warnings if keys are detected in languages that do not exist in default files"
    );
  },
};
