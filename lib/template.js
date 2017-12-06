const fs = require('fs');
const path = require('path');

module.exports = function Template(tmpl, data, directory=process.cwd(), output=path.resolve(process.cwd(), 'site')) {
  function attributesToHTML(attributes) {
    if(!attributes) return '';
    return Object.keys(attributes).filter((a) => {
      return ['content'].indexOf(a) === -1;
    }).map((a) => {
      return `${a}="${attributes[a]}"`;
    }).join(' ');
  }

  function include(file, attributes) {
    const extension = file.substr(file.lastIndexOf('.') + 1, file.length);
    const fileName = file.substr(file.lastIndexOf('/') + 1, file.length);

    switch (extension) {
      case 'html':
        return Template(fs.readFileSync(path.resolve(directory, file)).toString(), data, directory, output);
      case 'css':
        fs.createReadStream(path.resolve(directory, file)).pipe(fs.createWriteStream(path.resolve(output, fileName)));
        return `<link rel="stylesheet" href="./${fileName}" ${attributesToHTML(attributes)}>`;
      case 'png':
      case 'jpeg':
      case 'gif':
      case 'jpg':
      case 'svg':
        fs.createReadStream(path.resolve(directory, file)).pipe(fs.createWriteStream(path.resolve(output, fileName)));
        return `<img src="./${fileName}" ${attributesToHTML(attributes)}>`;
    }
  }

  data.include = include;

  function render(options) {
      var templ = tmpl.replace(/[\r\t\n]/g, ' ');
      var re = /{{[\s]*(.+?)[\s]*}}/g;
      var reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g;
      var code = 'var r=[];\n';
      var cursor = 0;
      var match;
      function add(line, js) {
          js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
              (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
          return add;
      }
      while(match = re.exec(templ)) {
          add(templ.slice(cursor, match.index))(match[1], true);
          cursor = match.index + match[0].length;
      }
      add(templ.substr(cursor, templ.length - cursor));
      code += 'return r.join("");';
      return new Function(`
        with(this) {
          ${code.replace(/[\r\t\n]/g, '')}
        }
      `).bind(options)();
  }

  return data ? render(data) : render;
};
