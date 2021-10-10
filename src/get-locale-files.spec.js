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
        [fileMock("/test/file.json")],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [],
          keyMatchExp: "[\\w]+",
        },
        mockLogger
      )
    ).toEqual([
      {
        ...fileMock("/test/file.json"),
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
        },
        mockLogger
      )
    ).toEqual([]);
  });

  it("should not return files outside the specified context", () => {
    expect(
      getLocaleFiles(
        [fileMock("/test/file.json"), fileMock("/test2/file.json")],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [],
          contexts: "otherFeature,test2",
          keyMatchExp: "[\\w]+",
        },
        mockLogger
      )
    ).toEqual([expect.objectContaining(fileMock("/test2/file.json"))]);
  });

  it("should not return files which do not match the configured key pattern", () => {
    expect(
      getLocaleFiles(
        [fileMock("/test/file.json"), fileMock("/test2/file.json")],
        {
          contextDelimiterKeys: ":",
          ignoreFiles: [],
          keyMatchExp: "[a-z]+",
        },
        mockLogger
      )
    ).toEqual([expect.objectContaining(fileMock("/test/file.json"))]);
  });

  it("should not return files which do not match the configured locale pattern", () => {
    expect(
      getLocaleFiles(
        [
          fileMock("/test/file.json"),
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
      expect.objectContaining(fileMock("/test/file.json")),
      expect.objectContaining(fileMock("/test/file.de-DE.json")),
    ]);
  });
});
