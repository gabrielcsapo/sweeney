const path = require('path');

const { copyDirectory } = require('./util');

module.exports = (directory) => {
  return new Promise(function(resolve, reject) {
    try {
      copyDirectory(path.resolve(__dirname, '..', 'test', 'fixtures'), directory);

      return resolve();
    } catch(ex) {
      return reject(ex);
    }
  });
};
