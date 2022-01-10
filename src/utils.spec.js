const fs = require("fs");
const {
  filterBlacklist,
  filterMatchingFiles,
  mapContextData,
  mapLocaleData,
  mergeContexts,
  mergeDefaultKeys,
  filterWhitelistedContexts,
  dropInvalidKeys,
  prefixContextKeys,
  mapContextToFile,
  mapValues,
  writeLocalesToXliff,
  formatToJson,
  formatToXliff,
  isIndentValid,
} = require("./utils");
const mockFile = require("../__mocks__/file.mock");
const logger = require("../__mocks__/logger.mock");

describe("utils", () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = logger();
  });

  describe("filterBlacklist", () => {
    it('should return false if "file" is contained in the blacklist', () => {
      const blacklist = [".DS_Store"];

      expect(
        filterBlacklist(blacklist)(mockFile("/User/.DS_Store"))
      ).toBeFalsy();
      expect(
        filterBlacklist(blacklist)(mockFile("/User/file.json"))
      ).toBeTruthy();
    });

    it("should only account for file names, not directories", () => {
      const blacklist = ["noextension"];
      expect(
        filterBlacklist(blacklist)(mockFile("/User/noextension"))
      ).toBeFalsy();
      expect(
        filterBlacklist(blacklist)(mockFile("/noextension/somefile.json"))
      ).toBeTruthy();
    });
  });

  describe("filterMatchingFiles", () => {
    it("should return false if any part of the file path does not match the pattern for locale filess", () => {
      const filter = filterMatchingFiles(mockLogger, "[a-z]+", "en_US", "json");
      expect(filter(mockFile("/dir/somefile.en_US.json"))).toBeTruthy();
      expect(filter(mockFile("/BadDir/somefile.en_US.json"))).toBeFalsy();
      expect(filter(mockFile("/dir/SomeFile.en_US.json"))).toBeFalsy();
      expect(filter(mockFile("/dir/somefile.json"))).toBeFalsy();
    });

    it("should log a warning if the locale does not match the required pattern", () => {
      const filter = filterMatchingFiles(mockLogger, "[a-z]+", "en_US", "json");
      filter(mockFile("/BadDir/somefile.en-US.json"));
      filter(mockFile("/BadDir/somefile.json"));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid Locale: "BadDir/somefile.en-US.json" is not a valid locale'
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid Locale: "BadDir/somefile.json" is not a valid locale'
      );
    });

    it("should log a warning if a file does not match", () => {
      const filter = filterMatchingFiles(mockLogger, "[a-z]+", "en_US", "json");
      filter(mockFile("/BadDir/somefile.en_US.json"));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid File: "BadDir/somefile.en_US.json" is not a valid file pattern'
      );
    });
  });

  describe("isIndentValid", () => {
    it("should return true if a text file contains the configured indentation style", () => {
      expect(
        isIndentValid(
          `
{
  "test": "key"
}
`,
          {
            indent: 2,
          }
        )
      ).toBeTruthy();
    });

    it('should return false if "tab" is configured but the file does not contain tab', () => {
      expect(
        isIndentValid(
          `
{
  "test": "key",
\t"another": "key"
}
      `,
          { indent: "tab" }
        )
      ).toBeFalsy();
    });

    it("should return false if the number of spaces is not the same as the configured one", () => {
      expect(
        isIndentValid(
          `
{
  "test": "key",
  "another": "key"
}
      `,
          { indent: 4 }
        )
      ).toBeFalsy();
    });
  });

  describe("mapContextData", () => {
    it("should create contexts and keys based on the file path", () => {
      const map = mapContextData(":");
      expect(map(mockFile("/strings/feature.json"))).toEqual(
        expect.objectContaining({
          contexts: ["strings", "feature"],
          key: "strings:feature",
        })
      );
    });

    it("should associate any files named the same as the reserved context with its parent directory", () => {
      const map = mapContextData(":", "default");
      expect(map(mockFile("/strings/feature/default.json"))).toEqual(
        expect.objectContaining({
          contexts: ["strings", "feature"],
          key: "strings:feature",
        })
      );
    });
  });

  describe("mapLocaleData", () => {
    it("should determine a locale based on the file name and matcher", () => {
      const map = mapLocaleData(/^[a-z]+\.([a-z]{2}-[A-Z]{2})\.json$/);
      expect(map(mockFile("feature.en-US.json"))).toEqual(
        expect.objectContaining({ locale: "en-US" })
      );
    });
  });

  describe("mergeContexts", () => {
    it("should group the contents of files by context and locale", () => {
      const group = mergeContexts(":");
      expect(
        group(
          {},
          {
            ...mockFile("/strings/feature.json"),
            contexts: ["strings", "feature"],
            locale: "en-US",
            content: {
              key: "value",
            },
          }
        )
      ).toEqual({
        strings: {
          "en-US": {
            key: "value",
          },
        },
        "strings:feature": {
          "en-US": {
            key: "value",
          },
        },
      });
    });

    it("should merge keys of existing groups", () => {
      const group = mergeContexts(":");
      expect(
        group(
          {
            strings: {
              "en-US": {
                key: "value",
              },
            },
            "strings:feature": {
              "en-US": {
                key: "value",
              },
            },
          },
          {
            ...mockFile("/strings/feature.json"),
            contexts: ["strings", "feature"],
            locale: "en-US",
            content: {
              key2: "value2",
            },
          }
        )
      ).toEqual({
        strings: {
          "en-US": {
            key: "value",
            key2: "value2",
          },
        },
        "strings:feature": {
          "en-US": {
            key: "value",
            key2: "value2",
          },
        },
      });
    });
  });

  describe("mergeDefaultKeys", () => {
    it("should ensure a locale has the same keys as the default", () => {
      const merge = mergeDefaultKeys("en-US");
      expect(
        merge([
          "test",
          {
            "en-US": {
              key: "value",
              key2: "value2",
            },
            "de-DE": {},
          },
        ])
      ).toEqual([
        "test",
        {
          "en-US": {
            key: "value",
            key2: "value2",
          },
          "de-DE": {
            key: "value",
            key2: "value2",
          },
        },
      ]);
    });

    it("should only add missing keys and not overwrite existing ones", () => {
      const merge = mergeDefaultKeys("en-US");
      expect(
        merge([
          "test",
          {
            "en-US": {
              key: "value",
              key2: "value2",
            },
            "de-DE": {
              key: "a different value",
            },
          },
        ])
      ).toEqual([
        "test",
        {
          "en-US": {
            key: "value",
            key2: "value2",
          },
          "de-DE": {
            key: "a different value",
            key2: "value2",
          },
        },
      ]);
    });
  });

  describe("filterWhitelistedContexts", () => {
    it("should return true if the whitelist is not set", () => {
      const filter = filterWhitelistedContexts(undefined, ":");
      expect(filter({ key: "test" })).toBeTruthy();
    });

    it("should return true if the key matches one of the whitelisted contexts", () => {
      const filter = filterWhitelistedContexts(["feature"], ":");
      expect(filter({ key: "feature" })).toBeTruthy();
      expect(filter({ key: "featureother" })).toBeFalsy();
    });

    it("should return true if the key contains one of the whitelisted contexts", () => {
      const filter = filterWhitelistedContexts(["test:feature"], ":");
      expect(filter({ key: "test:feature:tree" })).toBeTruthy();
      expect(filter({ key: "test:featureother:tree" })).toBeFalsy();
    });
  });

  describe("dropInvalidKeys", () => {
    it("should remove any keys that don't match the specified pattern", () => {
      const drop = dropInvalidKeys(mockLogger, /^[a-z]+$/);
      expect(
        drop({
          ...mockFile("/test/feature.json"),
          content: {
            goodkey: "value",
            badKey: "value",
          },
        })
      ).toEqual({
        ...mockFile("/test/feature.json"),
        content: {
          goodkey: "value",
        },
      });
    });

    it("should log a warning if an invalid key has been found", () => {
      const drop = dropInvalidKeys(mockLogger, /^[a-z]+$/);
      drop({
        ...mockFile("/test/feature.json"),
        content: {
          goodkey: "value",
          badKey: "value",
        },
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid Message Key: "badKey" found in /test/feature.json'
      );
    });
  });

  describe("mapValues", () => {
    it("should map string values to output", () => {
      const map = mapValues(mockLogger);
      expect(
        map({
          ...mockFile("/test/feature.json"),
          content: {
            goodkey: "Value",
          },
        })
      ).toEqual(
        expect.objectContaining({
          content: {
            goodkey: "Value",
          },
        })
      );
    });

    it("should map objects with a 'value' key to output", () => {
      const map = mapValues(mockLogger);
      expect(
        map({
          ...mockFile("/test/feature.json"),
          content: {
            goodkey: {
              value: "Value",
              description: "A good value",
            },
          },
        })
      ).toEqual(
        expect.objectContaining({
          content: {
            goodkey: "Value",
          },
        })
      );
    });

    it('should log a warning if the value does not contain a "value" key', () => {
      const map = mapValues(mockLogger);
      map({
        ...mockFile("/test/feature.json"),
        content: {
          badkey: {
            valuee: "Value",
            description: "A bad value",
          },
        },
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unsupported Message Structure for Key: "badkey" found in /test/feature.json'
      );
    });
  });

  describe("prefixContextKeys", () => {
    it("should map all keys with a prefix based on their context", () => {
      const mapPrefix = prefixContextKeys(":");
      expect(
        mapPrefix({
          ...mockFile("/test/feature.json"),
          key: "test:feature",
          content: {
            key: "value",
          },
        })
      ).toEqual(
        expect.objectContaining({
          content: {
            "test:feature:key": "value",
          },
        })
      );
    });
  });

  describe("mapContextToFile", () => {
    it("should convert a context into a file path and return it", () => {
      const map = mapContextToFile(":", "__");
      expect(map(["test:feature"])).toEqual(
        expect.objectContaining({
          file: "test__feature",
        })
      );
    });

    it("should support adding a suffix to a file", () => {
      const map = mapContextToFile(":", "__", "+intl-icu");
      expect(map(["test:feature"])).toEqual(
        expect.objectContaining({
          file: "test__feature+intl-icu",
        })
      );
    });

    it("should pass locale content", () => {
      const map = mapContextToFile(":", "__");
      expect(
        map([
          "test:feature",
          {
            "en-US": {
              key: "value",
            },
          },
        ])
      ).toEqual(
        expect.objectContaining({
          localeContents: {
            "en-US": {
              key: "value",
            },
          },
        })
      );
    });
  });

  describe("formatToJson", () => {
    it("should prepare a json file for each locale", () => {
      const format = formatToJson();

      const result = format({
        file: "testfile",
        localeContents: {
          "en-US": { "testfile:key": "value" },
          "de-DE": { "testfile:key": "wert" },
        },
      });

      expect(result).toEqual([
        {
          path: "testfile.en-US.json",
          content: JSON.stringify({ "testfile:key": "value" }, null, "\t"),
        },
        {
          path: "testfile.de-DE.json",
          content: JSON.stringify({ "testfile:key": "wert" }, null, "\t"),
        },
      ]);
    });
  });

  describe("formatToXliff", () => {
    it("should prepare an xliff file for each locale", () => {
      const format = formatToXliff("en-US");

      const result = format({
        file: "testfile",
        localeContents: {
          "en-US": { "testfile:key": "value" },
          "de-DE": { "testfile:key": "wert" },
        },
      });

      expect(result).toEqual([
        {
          path: "testfile.en-US.xml",
          content: [
            '<xliff xmlns="urn:oasis:names:tc:xliff:document:1.2" version="1.2">',
            `<file source-language="en-US" target-language="en-US">`,
            "<body>",
            `\t<trans-unit id="testfile:key">`,
            `\t\t<source>value</source>`,
            `\t\t<target>value</target>`,
            "\t</trans-unit>",
            "</body>",
            "</file>",
            "</xliff>",
          ].join("\n"),
        },
        {
          path: "testfile.de-DE.xml",
          content: [
            '<xliff xmlns="urn:oasis:names:tc:xliff:document:1.2" version="1.2">',
            `<file source-language="en-US" target-language="de-DE">`,
            "<body>",
            `\t<trans-unit id="testfile:key">`,
            `\t\t<source>value</source>`,
            `\t\t<target>wert</target>`,
            "\t</trans-unit>",
            "</body>",
            "</file>",
            "</xliff>",
          ].join("\n"),
        },
      ]);
    });
  });
});
