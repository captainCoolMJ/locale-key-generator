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

| Option                | Default               | Description                                                                                                                                                                               |
| --------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| baseLanguage          | en_US                 | Files with this code in the suffix of the filename will be treated as the base language. Any files which don't contain a base file will be discarded.                                     |
| outputFormat          | json                  | The desired export format. Possible values are `json` or `xliff`                                                                                                                          |
| contextDelimiterKeys  | :                     | How to specify contexts messages belong to                                                                                                                                                |
| contextDelimiterFiles | \_\_                  | How to specify contexts in the final output files                                                                                                                                         |
| localeRegionExp       | `/[a-z]{2}_[A-Z]{2}/` | The pattern to determine locale                                                                                                                                                           |
| keyMatchExp           | `/[\\w]+/`            | The style pattern contexts and message keys should enforce                                                                                                                                |
| ignoreFiles           | ['.DS_STORE']         | A list of files to be ignored by the parser                                                                                                                                               |
| filenameSuffix        |                       | A fixed string to apply at the end of the exported file                                                                                                                                   |
| reservedContext       | messages              | Files with this name will be rolled into the same context as their parent. For example, messages contained inside "some/feature/messages.en_US.json" will be namespaced as "some:feature" |
