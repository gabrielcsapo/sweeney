const fs = require('fs');
const path = require('path');

class Template {
  /**
   * handles the state of a template and can render it
   * @class Template
   * @param  {String}    template    - a string containing the template
   * @param  {String}    directory   - directory of where template if from
   * @param  {String}    output      - the output directory to store assets
   */
  constructor(template, directory=process.cwd(), output=path.resolve(process.cwd(), 'site')) {
    this.template = template;
    this.directory = directory;
    this.output = output;
  }
  /**
   * takes an attributes object and turns it into a html string
   * @method attributesToHTML
   * @memberof Template
   * @param  {Object} attributes - an object containing the html attributes
   * @return {String} - html attributes string
   */
  attributesToHTML(attributes) {
    if (!attributes) return '';
    return Object.keys(attributes).filter((a) => {
      return ['content'].indexOf(a) === -1;
    }).map((a) => {
      return `${a}="${attributes[a]}"`;
    }).join(' ');
  }
  /**
   * includes an asset or template from within a template
   * @method include
   * @memberof Template
   * @param  {String} file       - relative path from file to asset
   * @param  {Object} attributes - object with attribute keys that will turn into html
   * @return {String}            - compiled template or asset tag
   */
  include(data, file, attributes) {
    const { directory, output, attributesToHTML } = this;

    const filePath = path.resolve(directory, file);
    const extension = file.substr(file.lastIndexOf('.') + 1, file.length);
    const fileName = file.substr(file.lastIndexOf('/') + 1, file.length);

    switch (extension) {
      case 'html':
        return (new Template(fs.readFileSync(filePath).toString(), directory, output)).render(data);
      case 'css':
        fs.createReadStream(filePath).pipe(fs.createWriteStream(path.resolve(output, fileName)));
        return `<link rel="stylesheet" href="./${fileName}" ${attributesToHTML(attributes)}>`;
      case 'png':
      case 'jpeg':
      case 'gif':
      case 'jpg':
      case 'svg':
        fs.createReadStream(filePath).pipe(fs.createWriteStream(path.resolve(output, fileName)));
        return `<img src="./${fileName}" ${attributesToHTML(attributes)}>`;
    }
  }
  /**
   * renders the template to string
   * @method render
   * @memberof Template
   * @param  {Object}    data        - object that contains state for template
   * @return {string} - compiled template
   */
  render(data) {
    const { template, include } = this;

    data.include = include.bind(this, data);

    const templ = template.replace(/[\r\t\n]/g, ' ');
    const re = /{{[\s]*(.+?)[\s]*}}/g;
    const reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g;

    let code = 'var r=[];\n';
    let cursor = 0;
    let match;

    function add(line, js) {
      js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
        (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
      return add;
    }
    while (match = re.exec(templ)) {
      add(templ.slice(cursor, match.index))(match[1], true);
      cursor = match.index + match[0].length;
    }
    add(templ.substr(cursor, templ.length - cursor));
    code += 'return r.join("");';
    return new Function(`
      with(this) {
        ${code.replace(/[\r\t\n]/g, '')}
      }
    `).bind(data)();
  }
}

module.exports = Template;
