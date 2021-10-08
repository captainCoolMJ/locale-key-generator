#! /usr/bin/env node
const { build, lint } = require("..");
const path = require("path");
const fs = require("fs");
const argv = require("minimist")(process.argv.slice(2));

const cmdMap = { build, lint };

if (cmdMap[argv._]) {
  cmdMap[argv._]({
    inputPath: argv.i,
    outputPath: argv.o,
    contexts: argv.contexts,
    ...JSON.parse(
      fs.readFileSync(path.resolve(argv.config), { encoding: "utf-8" })
    ),
  });
} else {
  throw new Error("Invalid command supplied");
}
