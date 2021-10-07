#! /usr/bin/env node
const { build } = require("../");
const {
  NAME_MATCH_EXP,
  LOCALE_REGION_EXP,
  FILE_TYPE_EXP,
} = require("../src/constants");

build(
  "./content",
  "./output",
  new RegExp(`^${NAME_MATCH_EXP}(\.${LOCALE_REGION_EXP})?(${FILE_TYPE_EXP})?$`)
);
