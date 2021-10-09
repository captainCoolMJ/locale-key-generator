# Locale Key Generator

## Installation

Install the package via npm

```bash
npm install -g @captaincool/locale-key-generator
```

## Configuration

By default, keys will be exported based on the contents of `config.json`. To use a custom configuration, supply its path using the `--config` argument during execution

```bash
locale-keys export -i ./content -o ./output --config=custom-config.json
```

## Usage

```bash
# generate locale files for all contexts inside the 'content' directory and output them to 'output'
locale-keys export -i ./content -o ./output

# generate locale files for a specific context
locale-keys export -i ./content -o ./output --contexts=shared,web:coupon_banner

# lint the contents of the 'content' directory
locale-keys lint -i ./content
```

### Notes

Generates namespaced locale files and keys based on an input directory and configured output rules:

- Files and contexts should have a consistent naming pattern
- Keys should have a consistent naming pattern
- Files should be in JSON
- Locale files should be named with a 4 char locale + region code (e.g. en_US)
- Files without a locale extension will be treated as the 'default' version
- Keys for locale + region will take priority over "default" values
- Translated files should not contain keys which are not present in its 'default' version
- Messages should be implemented using the ICU message format https://unicode-org.github.io/icu/userguide/format_parse/messages/ specs
