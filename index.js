const path = require("path");
const fs = require("fs");
const {
  getMatchingFiles,
  extractLocaleContent,
  mergeLocaleGroups,
} = require("./src/utils");

module.exports = {
  build: (startPath, outputPath, matchExp) => {
    const localeFiles = getMatchingFiles(path.resolve(startPath), [], matchExp);
    const localeData = extractLocaleContent(localeFiles, startPath);
    const merged = mergeLocaleGroups(localeData);

    if (!fs.existsSync(path.resolve(outputPath))) {
      fs.mkdirSync(path.resolve(outputPath), { recursive: true });
    }

    Object.entries(merged).forEach(([contextGroup, localeData]) => {
      const outputFilePath = path.resolve(
        outputPath,
        contextGroup.replace(/:/g, "__")
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
  lint: (startPath, outputPath, matchExp) => {
    console.log("TODO: Provide warnings if duplicate keys are encountered");
    console.log("TODO: Provide warnings if invalid file names are encountered");
    console.log("TODO: Provide warnings if file names do not use snake case");
    console.log("TODO: Provide warnings if keys do not use snake case");
    console.log(
      "TODO: Provide warnings if keys are detected in languages that do not exist in default files"
    );
  },
};
