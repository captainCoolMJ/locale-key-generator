#! /usr/bin/env node
const { build, lint } = require("..");
const path = require("path");
const fs = require("fs");
const logger = require("../src/logger");
const argv = require("minimist")(process.argv.slice(2));

const cmdMap = { build, lint };

const argMap = {
  i: "inputPath",
  o: "outputPath",
  contexts: "contexts",
};

try {
  let config = {};
  if (argv.config && fs.existsSync(path.resolve(argv.config))) {
    config = JSON.parse(
      fs.readFileSync(path.resolve(argv.config), {
        encoding: "utf-8",
      })
    );
  }

  if (cmdMap[argv._]) {
    Object.entries(argv).forEach(([argKey, value]) => {
      if (typeof argMap[argKey] !== "undefined") {
        config[argMap[argKey]] = value;
      }
    });

    cmdMap[argv._]({
      dryRun: String(argv["dry-run"]) === "true",
      ...config,
    });
  } else {
    throw new Error("Invalid command supplied");
  }
} catch (e) {
  logger.error(e.message);
  process.exit(1);
}
