const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { parse } = require('./util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

module.exports = async function crawl (plugins, output, source, directory) {
  let found = [];
  // by default we want to crawl the source directory
  if (!directory) directory = source;

  const files = await readdir(directory);

  for (var i = 0; i < files.length; i++) {
    const file = files[i];

    const stats = await stat(`${directory}/${file}`);
    if (stats.isDirectory()) {
      const subFiles = await crawl(plugins, output, source, `${directory}/${file}`);

      found = found.concat([...subFiles]);
    }

    if (stats.isFile() && file.substr(file.lastIndexOf('.'), file.length) === '.sy') {
      const parsedFile = await parse(plugins, `${directory}/${file}`);
      const parentDirectory = path.dirname(parsedFile.filePath).replace(this.source, '');

      if (parentDirectory) {
        parsedFile.outputPath = path.resolve(output, parentDirectory.substring(1, parentDirectory.length), `${parsedFile.name}.html`);
      } else {
        parsedFile.outputPath = path.resolve(output, `${parsedFile.name}.html`);
      }

      found.push(parsedFile);
    }
  }

  return found;
};
