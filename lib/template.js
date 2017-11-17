const fs = require('fs');
const path = require('path');

module.exports = function template(str, data, directory) {
  function include(file) {
    return template(fs.readFileSync(path.resolve(directory, file)).toString(), data, directory);
  }
  data.include = include;

  var fn = new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push(\'' +
    str
      .replace(/[\r\t\n]/g, ' ')
      .split('{{').join('\t')
      .replace(/((^|\}\})[^\t]*)'/g, '$1\r')
      .replace(/\t(.*?)\}\}/g, '\',$1,\'')
      .split('\t').join('\');')
      .split('}}').join('p.push(\'')
      .split('\r').join('\\\'')
  + '\');}return p.join(\'\');');

  return data ? fn(data) : fn;
};
