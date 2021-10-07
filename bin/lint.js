#! /usr/bin/env node
const { lint } = require("../");
const {
  NAME_MATCH_EXP,
  LOCALE_REGION_EXP,
  FILE_TYPE_EXP,
} = require("../src/constants");

lint(
  "./content",
  "./output",
  new RegExp(`^${NAME_MATCH_EXP}(\.${LOCALE_REGION_EXP})?(${FILE_TYPE_EXP})?$`)
);
