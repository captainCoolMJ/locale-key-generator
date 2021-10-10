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
  writeLocalesToFile,
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
    it("should return false if any part of the file path does not match the given expression", () => {
      const filter = filterMatchingFiles(mockLogger, /^[a-z]+(\.json)?$/);
      expect(filter(mockFile("/BadDir/somefile.json"))).toBeFalsy();
      expect(filter(mockFile("/dir/SomeFile.json"))).toBeFalsy();
      expect(filter(mockFile("/dir/somefile.json"))).toBeTruthy();
    });

    it("should log a warning if a file does not match", () => {
      const filter = filterMatchingFiles(mockLogger, /^[a-z]+(\.json)?$/);
      filter(mockFile("/BadDir/somefile.json"));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid Name: "BadDir/somefile.json" is not valid'
      );
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
  });

  describe("mapLocaleData", () => {
    it("should determine a locale based on the file name and matcher", () => {
      const map = mapLocaleData(/^[a-z]+\.([a-z]{2}-[A-Z]{2})\.json$/);
      expect(map(mockFile("feature.en-US.json"))).toEqual(
        expect.objectContaining({ locale: "en-US" })
      );
    });

    it("should set a default locale if one is not supplied", () => {
      const map = mapLocaleData(/^[a-z]+\.([a-z]{2}-[A-Z]{2})\.json$/, "en-US");
      expect(map(mockFile("feature.json"))).toEqual(
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

  describe("writeLocalesToFile", () => {
    beforeEach(() => {
      jest.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);
    });

    afterEach(() => {
      fs.writeFileSync.mockReset();
    });

    it("should write a locale file for each one passed in", () => {
      const write = writeLocalesToFile(mockLogger);

      write({
        file: "testfile",
        localeContents: {
          "en-US": { "testfile:key": "value" },
          "de-DE": { "testfile:key": "value" },
        },
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "testfile.en-US.json",
        JSON.stringify({ "testfile:key": "value" }, null, "\t")
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "testfile.de-DE.json",
        JSON.stringify({ "testfile:key": "value" }, null, "\t")
      );
    });

    it("should log the file path to the console", () => {
      const write = writeLocalesToFile(mockLogger);

      write({
        file: "testfile",
        localeContents: {
          "en-US": { "testfile:key": "value" },
          "de-DE": { "testfile:key": "value" },
        },
      });

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Wrote "testfile.en-US.json"'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Wrote "testfile.de-DE.json"'
      );
    });

    describe("dry run", () => {
      it("should not call fs.writeFileSync", () => {
        const write = writeLocalesToFile(mockLogger, true);

        write({
          file: "testfile",
          localeContents: {
            "en-US": { "testfile:key": "value" },
            "de-DE": { "testfile:key": "value" },
          },
        });

        expect(fs.writeFileSync).not.toHaveBeenCalled();
      });
    });
  });
});
