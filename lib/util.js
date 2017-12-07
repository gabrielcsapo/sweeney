const fs = require('fs');
const path = require('path');

module.exports.getConfig = function getConfig(directory) {
  if(fs.existsSync(path.resolve(directory, 'sweeney.js'))) {
    return require(path.resolve(directory, 'sweeney.js'));
  }
  if(fs.existsSync(path.resolve(directory, '.sweenyrc'))) {
    return require(path.resolve(directory, '.sweenyrc'));
  }
  return {
    source: directory,
    output: path.resolve(directory, 'site')
  };
}

module.exports.copyDirectory = function copyDirectory(source, destination) {
  var exists = fs.existsSync(source);
  var stats = exists && fs.statSync(source);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    fs.mkdirSync(destination);
    fs.readdirSync(source).forEach(function(childItemName) {
      copyDirectory(path.join(source, childItemName), path.join(destination, childItemName));
    });
  } else {
    fs.writeFileSync(destination, fs.readFileSync(source));
  }
};

module.exports.parse = function parse(content) {
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
};
