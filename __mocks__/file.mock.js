module.exports = (file) => ({
  path: file,
  parts: file.split("/").slice(1),
  file: file.split("/").slice(-1)[0],
});
