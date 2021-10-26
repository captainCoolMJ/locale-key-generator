# Locale Key Generator

## Installation

Install the package via [npm](https://www.npmjs.com/)

```bash
npm install -g @captaincool/locale-key-generator
```

## Configuration

By default, keys will be exported based on the contents of `config.json`. To use a custom configuration, supply its path using the `--config` argument during execution

```bash
locale-keys export -i ./content -o ./output --config=customConfig.json
```

## Usage

```bash
# generate locale files for all contexts inside the 'content' directory and output them to 'output'
locale-keys export -i ./content -o ./output

# generate locale files for a specific context
locale-keys export -i ./content -o ./output --contexts=shared,web:feature

# lint the contents of the 'content' directory
locale-keys lint -i ./content
```

## Options

| Option                | Default               | Description                                                            |
| --------------------- | --------------------- | ---------------------------------------------------------------------- |
| defaultLocale         | en_US                 | Files without a locale suffixed in the name will default to this value |
| contextDelimiterKeys  | :                     | How to specify contexts messages belong to                             |
| contextDelimiterFiles | \_\_                  | How to specify contexts in the final output files                      |
| localeRegionExp       | `/[a-z]{2}-[A-Z]{2}/` | The pattern to determine locale                                        |
| nameMatchExp          | `/[\\w]+/`            | The style pattern contexts and message keys should enforce             |
| ignoreFiles           | []                    | A list of files to be ignored by the parser                            |
