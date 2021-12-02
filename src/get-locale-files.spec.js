const fileMock = require("../__mocks__/file.mock");
const loggerMock = require("../__mocks__/logger.mock");
const getLocaleFiles = require("./get-locale-files");

describe("getLocaleFiles", () => {
  let mockLogger;
  beforeEach(() => {
    mockLogger = loggerMock();
  });

  it("should return files with context data attached", () => {
    expect(
      getLocaleFiles(
        [fileMock("/test/file.en_US.json")],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [],
          keyMatchExp: "[\\w]+",
          localeRegionExp: "[a-z]{2}_[A-Z]{2}",
        },
        mockLogger
      )
    ).toEqual([
      {
        ...fileMock("/test/file.en_US.json"),
        contexts: ["test", "file"],
        key: "test:file",
      },
    ]);
  });

  it("should not return ignored files", () => {
    expect(
      getLocaleFiles(
        [fileMock("/test/.DS_Store")],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [".DS_Store"],
          keyMatchExp: "[\\w]+",
          localeRegionExp: "[a-z]{2}_[A-Z]{2}",
        },
        mockLogger
      )
    ).toEqual([]);
  });

  it("should not return files outside the specified context", () => {
    expect(
      getLocaleFiles(
        [fileMock("/test/file.en_US.json"), fileMock("/test2/file.en_US.json")],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [],
          contexts: "otherFeature,test2",
          keyMatchExp: "[\\w]+",
          localeRegionExp: "[a-z]{2}_[A-Z]{2}",
        },
        mockLogger
      )
    ).toEqual([expect.objectContaining(fileMock("/test2/file.en_US.json"))]);
  });

  it("should not return files which do not match the configured key pattern", () => {
    expect(
      getLocaleFiles(
        [fileMock("/test/file.en_US.json"), fileMock("/test2/file.en_US.json")],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [],
          keyMatchExp: "[a-z]+",
          localeRegionExp: "[a-z]{2}_[A-Z]{2}",
        },
        mockLogger
      )
    ).toEqual([expect.objectContaining(fileMock("/test/file.en_US.json"))]);
  });

  it("should not return files which do not match the configured locale pattern", () => {
    expect(
      getLocaleFiles(
        [
          fileMock("/test/file.en-US.json"),
          fileMock("/test/file.de_DEjson"),
          fileMock("/test/file.de-DE.json"),
        ],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [],
          keyMatchExp: "[a-z]+",
          localeRegionExp: "[a-z]{2}-[A-Z]{2}",
        },
        mockLogger
      )
    ).toEqual([
      expect.objectContaining(fileMock("/test/file.en-US.json")),
      expect.objectContaining(fileMock("/test/file.de-DE.json")),
    ]);
  });
});
