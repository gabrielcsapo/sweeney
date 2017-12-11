/**
 * @module lib/util
 */

const fs = require('fs');
const path = require('path');

const { promisify } = require('util');

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

/**
 * ensures the given path exists, if not recursively generates folder leading to the paths
 * @method ensureDirectoryExists
 * @param  {String} directory - the given path
 */
async function ensureDirectoryExists(directory) {
  let parts = directory.split('/').slice(1);
  let currentDirectory = '';
  while (parts.length > 0) {
    currentDirectory += `/${parts.shift()}`;

    try {
      await stat(currentDirectory);
    } catch (ex) {
      await mkdir(currentDirectory);
    }
  }
}

/**
 * recursively copies the content of one directory to another
 * @method copyDirectory
 * @param  {String} source      - path to source
 * @param  {String} destination - path to destination
 */
async function copyDirectory(source, destination) {
  const stats = await stat(source);

  if (stats.isDirectory()) {
    await ensureDirectoryExists(destination);

    const files = await readdir(source);

    files.forEach(async function(childItemName) {
      await copyDirectory(path.join(source, childItemName), path.join(destination, childItemName));
    });
  } else {
    await writeFile(destination, await readFile(source));
  }
}

/**
 * parses the contents of a string to find the options block
 * @method parse
 * @param  {String} content - file contents that could potentially contain options
 * @return {Object} - with the attributes options and content
 */
function parse(content) {
  if (/^---\n/.test(content)) {
    var end = content.search(/\n---\n/);
    if (end != -1) {
      return {
        options: JSON.parse(content.slice(4, end + 1)) || {},
        content: content.slice(end + 5)
      };
    }
  }
  return {
    options: {},
    content: content
  };
}

/**
 * takes ms and returns human readable time string
 * @method ms
 * @memberof lib/util
 * @param  {Number} ms    - time in milleseconds
 * @return {String}       - human readable string
 */
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;

function ms(ms) {
  if (ms >= d) {
    return `${Math.floor(ms / d)}d`;
  }
  if (ms >= h) {
    return `${Math.floor(ms / h)}h`;
  }
  if (ms >= m) {
    return `${Math.floor(ms / m)}m`;
  }
  if (ms >= s) {
    return `${Math.floor(ms / s)}s`;
  }
  return ms + 'ms';
}

module.exports = {
  parse,
  copyDirectory,
  ensureDirectoryExists,
  ms
};
