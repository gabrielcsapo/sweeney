const fs = require('fs');
const path = require('path');

module.exports = function Template(tmpl, data, directory=process.cwd(), output=path.resolve(process.cwd(), 'site')) {
  function include(file) {
    const extension = file.substr(file.lastIndexOf('.') + 1, file.length);
    const fileName = file.substr(file.lastIndexOf('/') + 1, file.length);

    switch (extension) {
      case 'html':
        return Template(fs.readFileSync(path.resolve(directory, file)).toString(), data, directory, output);
      case 'css':
        fs.createReadStream(path.resolve(directory, file)).pipe(fs.createWriteStream(path.resolve(output, fileName)));
        return `<link rel="stylesheet" href="./${fileName}">`;
      case 'img':
        fs.createReadStream(path.resolve(directory, file)).pipe(fs.createWriteStream(path.resolve(output, fileName)));
        return `<img src="./${fileName}">`;
    }
  }

  data.include = include;

  var fn = new Function('data', `
    var p = [];
    var print = function(){
      p.push.apply(p,arguments);
    };
    with(data){
      p.push('${tmpl
        .replace(/[\r\t\n]/g, ' ')
        .split('{{').join('\t')
        .replace(/((^|\}\})[^\t]*)'/g, '$1\r')
        .replace(/\t(.*?)\}\}/g, '\',$1,\'')
        .split('\t').join(');')
        .split('}}').join('p.push(\'')
        .split('\r').join('\\\'')
      }')
    }
    return p.join('');
  `);

  return data ? fn(data) : fn;
};
