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

  if (!stats.isFile() && stats.isDirectory()) {
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
 * retrieves a config from the given directory
 * @method getConfig
 * @param  {String}  directory - path of directory
 * @return {Object}  - config object
 */
async function getConfig(directory) {
  async function resolve(config) {
    switch (typeof config) {
      case 'object':
        if (config instanceof Promise) {
          return await config();
        }
        return config;
      case 'function':
        return config();
    }
  }

  try {
    await stat(`${directory}/.sweeney`);
    return await resolve(require(`${directory}/.sweeney`));
  } catch (ex) {
    // propogate message to the user, this is something with the config
    if (ex.message.indexOf('no such file or directory') === -1) {
      throw ex;
    }
    return {};
  }
}

/**
 * parses a template string for any options or content it contains
 * @method parseString
 * @param  {String}    filePath - The file path of where the string is from, needed for includes or anything path related
 * @param  {String}    content  - Template string
 * @return {Object}    - parsed template output
 */
function parseString(filePath, content) {
  let config = {};

  // this is the name of the file without the extension, used for internal use or during the output process
  config.name = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length - 3);

  // let's check for any special sweeney tags
  // the first capture group is the block and the second is the argument
  if (/{{-- (.+?) (.+?) --}}/g.test(content)) {
    let reg = new RegExp(/{{-- (.+?) (.+?) --}}/g);
    let block;
    while ((block = reg.exec(content)) != null) {
      let type = block[1];
      let argument = block[2];
      if (!config[type]) config[type] = [];
      // let's normalize the path if given a relative one
      if (type === 'includes') {
        let oldArgument = JSON.parse(JSON.stringify(argument));
        argument = path.resolve(path.dirname(filePath), argument);
        // let's update the content of the file to reflect the need for the specific file
        content = content.replace(`{{-- ${type} ${oldArgument} --}}`, `{{-- ${type} ${argument} --}}`);
      }
      config[type].push(argument);
    }
  }
  if (/^---\n/.test(content)) {
    var end = content.search(/\n---\n/);
    if (end != -1) {
      let parsed = JSON.parse(content.slice(4, end + 1));
      // this is the top level attribute in the render function that will allow users to do things like
      // {{ posts.forEach((post) => {...}) }} _In this case posts will be an array_
      config.collection = parsed.collection || 'page';
      // type is the value that the parser will look at to decide what to do with that file
      config.type = parsed.type || 'html';
      config.options = parsed;
      config.content = content.slice(end + 5);

      if (parsed.layout) config.layout = parsed.layout;
    }
  }
  return config;
}

/**
 * parses the contents of a string to find the options block
 * @method parse
 * @param  {String} content - file contents that could potentially contain options
 * @return {Object} - with the attributes options and content
 */
async function parse(filePath) {
  let content = await readFile(filePath);

  let config = {
    path: filePath,
    options: {},
    content: content
  };

  return Object.assign(config, parseString(filePath, content.toString('utf8')));
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

/**
 * Renders a template object, parsed by `parse`
 * @method render
 * @param  {Object} templates       - object key template values
 * @param  {Object} template        - parsed template object
 * @param  {Object} additional      - additional data that needs to be merged into template data
 * @return {String}                 - rendered template to string
 */
async function render(templates, template, additional = {}) {
  let { includes = [], content = '', path } = template;
  // combine the data from the template and whatever is passed in
  let data = merge(additional, template);
  if (!content) return;

  try {
    if (includes.length > 0) {
      // loop through the includes and figure out what we need to do
      for (var i = 0; i < includes.length; i++) {
        let include = includes[i];
        let ext = include.substring(include.lastIndexOf('.') + 1, include.length);
        let name = include.substring(include.lastIndexOf('/') + 1, include.length - 3);
        let _content = await readFile(include);

        switch (ext) {
          case 'sy':
            content = content.replace(`{{-- includes ${include} --}}`, await render(templates, templates[name], data));
            break;
          case 'css':
            content = content.replace(`{{-- includes ${include} --}}`, `<style>${_content}</style>`);
            break;
          case 'png':
          case 'jpeg':
          case 'gif':
          case 'jpg':
          case 'svg':
            // TODO: we probably want to copy the asset somewhere close by and reference it in the output correctly
            content = content.replace(`{{-- includes ${include} --}}`, '');
            break;
          default:
            // we are just going to read the file's content and inject it into the template
            content = content.replace(`{{-- includes ${include} --}}`, _content.toString('utf8'));
            break;
        }
      }
    }

    const templ = content.replace(/[\r\t\n]/g, ' ');
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

    let rendered = new Function(`
      with(this) {
        ${code.replace(/[\r\t\n]/g, '')}
      }
    `).bind(data)();

    // if this template has a layout file we must render this then the layout file
    let layout = template.layout && templates[template.layout];

    if (layout) {
      // we have to delete the old layout
      delete data['layout'];

      return await render(templates, layout, Object.assign(data, {
        child: rendered
      }));
    } else {
      return rendered;
    }

  } catch (ex) {
    throw new Error(JSON.stringify({
      error: `Error building template ${path}`,
      content: content,
      stack: ex.stack
    }));
  }
}

/**
 * deep merge two objects (either arrays or plain javascript objects)
 * @method merge
 * @param  {Object|Array} target - an array or object, must be the same type as the other value being passed
 * @param  {Object|Array} source - an array or object, must be the same type as the other value being passed
 * @return {Object|Array}        - an array or object, depending on what has been passed in
 */
function merge(target, source) {
  if (typeof target == 'object' && typeof source == 'object') {
    for (const key in source) {
      if (source[key] === null && (target[key] === undefined || target[key] === null)) {
        target[key] = null;
      } else if (source[key] instanceof Array) {
        if (!target[key]) target[key] = [];
        //concatenate arrays
        target[key] = target[key].concat(source[key]);
      } else if (typeof source[key] == 'object') {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

module.exports = {
  merge,
  parse,
  parseString,
  render,
  ms,
  getConfig,
  ensureDirectoryExists,
  copyDirectory
};
