#! /usr/bin/env node
const { build, lint } = require("..");
const argv = require("minimist")(process.argv.slice(2));

const cmdMap = { build, lint };

if (cmdMap[argv._]) {
  cmdMap[argv._]({
    inputPath: argv.i,
    outputPath: argv.o,
    contexts: argv.contexts,
  });
} else {
  throw new Error("Invalid command supplied");
}
