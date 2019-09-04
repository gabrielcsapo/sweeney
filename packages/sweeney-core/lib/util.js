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

async function getConfigInDirectory (program) {
  const config = await getConfig(program.source ? path.resolve(process.cwd(), program.source) : process.cwd());

  config.source = program.source ? path.resolve(process.cwd(), program.source) : config.source ? path.resolve(process.cwd(), config.source) : process.cwd();
  config.output = program.output ? path.resolve(process.cwd(), program.output) : config.output ? path.resolve(process.cwd(), config.output) : path.resolve(process.cwd(), 'site');

  return config;
}

/**
 * ensures the given path exists, if not recursively generates folder leading to the paths
 * @method ensureDirectoryExists
 * @param  {String} directory - the given path
 */
async function ensureDirectoryExists (directory) {
  const parts = directory.split('/').slice(1);
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
 * executes a function and returns the time in human readable format
 * @method time
 * @param  {Function} func - the function to be executed
 * @return {String}        - human readable time string
 */
async function time (func) {
  const start = process.hrtime();

  await func();

  const end = process.hrtime(start);

  return `${(end[1] / 1000000).toFixed(2)}ms`;
}

/**
 * recursively copies the content of one directory to another
 * @method copyDirectory
 * @param  {String} source      - path to source
 * @param  {String} destination - path to destination
 */
async function copyDirectory (source, destination) {
  const stats = await stat(source);

  if (!stats.isFile() && stats.isDirectory()) {
    await ensureDirectoryExists(destination);

    const files = await readdir(source);

    for (var i = 0; i < files.length; i++) {
      const childItemName = files[i];
      await copyDirectory(path.join(source, childItemName), path.join(destination, childItemName));
    }
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
async function getConfig (directory) {
  try {
    const config = require(`${directory}/.sweeney`);

    switch (typeof config) {
      case 'object':
        return config;
      case 'function':
        return config();
    }
  } catch (ex) {
    // propogate message to the user, this is something with the config
    if (ex.message.indexOf('Cannot find module') === -1) {
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
async function parseString (plugins, filePath, content) {
  const config = {
    rawContent: content
  };

  // this is the name of the file without the extension, used for internal use or during the output process
  config.name = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length - 3);

  // let's run through the plugins
  for (const plugin of plugins) {
    if (!plugin.parse) continue;

    const output = await plugin.parse(filePath, content);

    if (output) {
      if (output.content !== content) content = output.content; // update the content with the augmented one
      if (output.found.length > 0) config[plugin.name] = output.found;
    }
  }

  if (/^---\n/.test(content)) {
    var end = content.search(/\n---\n/);
    if (end !== -1) {
      const parsed = JSON.parse(content.slice(4, end + 1));
      // this is the top level attribute in the render function that will allow users to do things like
      // {{ posts.forEach((post) => {...}) }} _In this case posts will be an array_
      config.collection = parsed.collection || 'page';
      // type is the value that the parser will look at to decide what to do with that file
      config.type = parsed.type || 'html';
      config.options = parsed;
      config.content = content.slice(end + 5);
      config.rawContent = config.rawContent.slice(end + 5);

      if (parsed.layout) config.layout = parsed.layout;
    }
  } else {
    config.content = content;
    config.type = 'html';
    config.collection = 'page';
  }

  return config;
}

/**
 * parses the contents of a string to find the options block
 * @method parse
 * @param  {String} content - file contents that could potentially contain options
 * @return {Object} - with the attributes options and content
 */
async function parse (plugins, filePath) {
  const content = await readFile(filePath, 'utf8');

  const config = {
    filePath,
    options: {},
    content: content,
    rawContent: content
  };

  return Object.assign(config, await parseString(plugins, filePath, content));
}

/**
 * Renders a template object, parsed by `parse`
 * @method render
 * @param  {Object} templates       - object key template values
 * @param  {Object} template        - parsed template object
 * @param  {Object} additional      - additional data that needs to be merged into template data
 * @return {String}                 - rendered template to string
 */
async function render (plugins, templates, template, additional = {}) {
  const start = process.hrtime();

  const { filePath } = template;
  let { content = '' } = template;

  // combine the data from the template and whatever is passed in
  const data = merge(additional, template);
  if (!content) return;

  try {
    // let's run through rendering any plugin data that was parsed out
    const tempDepends = [];

    for (const plugin of plugins) {
      const { name } = plugin;

      if (data[name] && data[name].length > 0) {
        for (const found of data[name]) {
          if (!plugin.render) continue;

          const output = await plugin.render(plugins, filePath, content, templates, data, found);

          if (output.content) content = output.content;
          if (output.depends) tempDepends.push(output.depends);
        }
      }
    }

    if (tempDepends.length > 0) {
      data.depends = [].concat.apply([], tempDepends);
    }

    const templ = content.replace(/[\r\t\n]/g, ' ');
    const re = /{{[\s]*(.+?)[\s]*}}/g;

    let code = 'var r=[];\n';
    let cursor = 0;
    let match = '';

    function add (line, js) { // eslint-disable-line no-inner-declarations
      const reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g;

      js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n')
        : (code += line !== '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
      return add;
    }

    while ((match = re.exec(templ)) !== null) {
      add(templ.slice(cursor, match.index))(match[1], true);
      cursor = match.index + match[0].length;
    }
    add(templ.substr(cursor, templ.length - cursor));
    code += 'return r.join("");';

    /* eslint-disable no-new-func */
    const rendered = new Function(`
      with(this) {
        ${code.replace(/[\r\t\n]/g, '')}
      }
    `).bind(data)();
    /* eslint-enable no-new-func */

    // if this template has a layout file we must render this then the layout file
    const layout = template.layout && templates[template.layout];
    // why are we doing this, well we pass around data a fairbit and we want to snapshot the state of the depends field at this point
    const depends = data.depends ? JSON.parse(JSON.stringify(data.depends)) : [];

    const safeData = {};
    Object.keys(data).forEach((k) => {
      if (k !== 'depends' && k !== 'layout') {
        safeData[k] = data[k];
      }
    });

    if (layout) {
      // we have to delete the old layout
      delete data['layout'];

      const output = await render(plugins, templates, layout, Object.assign({
        child: rendered
      }, safeData));

      return {
        data: JSON.parse(JSON.stringify(safeData)),
        filePath,
        depends: output,
        rendered: output.rendered,
        shouldRender: true,
        time: process.hrtime(start)[1] / 1000000
      };
    } else {
      return {
        data: JSON.parse(JSON.stringify(safeData)),
        filePath,
        rendered,
        depends, // this is if any plugin has added dependency information to the template
        time: process.hrtime(start)[1] / 1000000
      };
    }
  } catch (ex) {
    throw new Error(JSON.stringify({
      error: `Error building template ${filePath}`,
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
function merge (target, source) {
  if (typeof target === 'object' && typeof source === 'object') {
    for (const key in source) {
      if (source[key] === null && (target[key] === undefined || target[key] === null)) {
        target[key] = null;
      } else if (source[key] instanceof Array) {
        if (!target[key]) target[key] = [];
        // concatenate arrays
        target[key] = target[key].concat(source[key]);
      } else if (typeof source[key] === 'object') {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

/**
 * recursively goes through render item to find the total time of rendered dependencies
 * @param  {Object} item - rendered item output by render method
 * @return {Number} - time in milleseconds
 */
function getTotalTimeOfDepends (item) {
  let time = 0;

  if (Array.isArray(item)) {
    time += item.map((i) => getTotalTimeOfDepends(i)).reduce((a, b) => a + b, 0);
  }

  if (!Array.isArray(item) && typeof item === 'object') {
    time += item.time;
  }

  // recursively find the depends values
  if (item.depends) time += getTotalTimeOfDepends(item.depends);

  return time;
}

/**
 * renders a dependency tree from the given render item
 * @param  {Object} item  - render item
 * @param  {Number} level - the level of the tree that the element is a part of (by default is 0)
 * @return {String} - ascii representation of render tree for the given item
 */
function renderSubDepends (item, level = 0) {
  let output = '';

  if (Array.isArray(item)) {
    output += item.map((i) => renderSubDepends(i, level)).join('');
  }

  if (!Array.isArray(item) && typeof item === 'object') {
    output += `\n${level === 0 ? '' : ' '.repeat(level * 2) + '-'} ${item.filePath} [${item.time.toFixed(2)}ms]`;
  }

  if (item.depends) output += renderSubDepends(item.depends, level + 1);

  return output;
}

module.exports = {
  merge,
  parse,
  parseString,
  render,
  time,
  getConfig,
  ensureDirectoryExists,
  copyDirectory,
  getConfigInDirectory,
  renderSubDepends,
  getTotalTimeOfDepends
};
