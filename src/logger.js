class Logger {
  constructor() {
    this._warnCount = 0;
  }
  info(...args) {
    console.info(...args);
  }
  error(...args) {
    console.log("\x1b[31m", ...args, "\x1b[0m");
  }
  success(...args) {
    console.log("\x1b[32m", ...args, "\x1b[0m");
  }
  warn(...args) {
    this._warnCount++;
    console.warn("\x1b[33m", ...args, "\x1b[0m");
  }
  getWarnCount() {
    return this._warnCount;
  }
}

module.exports = new Logger();
