const fs = require('fs');
const path = require('path');
const Markdown = require('markdown-it')();
const { promisify } = require('util');

const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const Template = require('./template');
const { parse, copyDirectory, ensureDirectoryExists } = require('./util');

class Site {
  /**
   * maintains the global state of a site
   * @class  Site
   * @param  {String} directory - the root path to the site
   * @param  {Object} config    - config options for the site
   */
  constructor(directory, config) {
    this.directory = directory;
    this.config = config;
    this.output = config.output ? path.resolve(directory, config.output) : path.resolve(directory, 'site');
  }
  /**
   * generates a site given the directory and config object
   * @method generate
   * @memberof Site
   * @inner
   * @param  {String} directory - the directory where site files are contained
   * @param  {Object=} config    - contains overrides to build scripts
   * @param  {String} config.output - output override for built files
   */
  async generate() {
    const self = this;
    const { renderTemplate, directory, config, output } = this;

    // make sure the output directory exists
    await ensureDirectoryExists(output);

    const posts = await Site.getTemplates(`${directory}/posts`);
    const root = await Site.getTemplates(directory);

    root.concat(posts).forEach(async function(post) {
      // TODO: expose related articles
      // TODO: expose next articles (can be configurable by default 3)

      await writeFile(`${output}/${post.file}.html`, await renderTemplate.bind(self)(directory, post.path, Object.assign({ content: post.content, posts, post, page: {}, site: {} }, config), output));
    });
  }
  /**
   * given a template file will render it and its layout
   * @method renderTemplate
   * @memberof Site
   * @param  {String}       basePath        - the project root path
   * @param  {String}       filePath        - the absolute path to the file
   * @param  {Object}       opts            - options to be passed to template function
   * @param  {String}       outputDirectory - the absolute path to the output directory
   * @return {String}                       - the rendered template
   */
  async renderTemplate(basePath, filePath, opts, outputDirectory) {
    const sourceDirectory = filePath.substr(0, filePath.lastIndexOf('/'));
    let { options, content } = parse((await readFile(filePath)).toString('utf8'));

    // recursively render necessary output when using templates
    if(options && options.layout) {
      return await this.renderTemplate(basePath, path.resolve(basePath, `layouts/${options.layout}.html`), Object.assign(opts, {
        content: (new Template(content, sourceDirectory, outputDirectory)).render(opts)
      }), outputDirectory);
    }

    return (new Template(content, sourceDirectory, outputDirectory)).render(opts);
  }
  /**
   * gets valid template files from the given directory
   * @method getTemplates
   * @memberof Site
   * @param  {String}  directory      - the path of the directory to search for template files
   * @param  {Boolean} enforceOptions - enforce that options block is in the given files
   * @return {Object[]}               - an array of objects
   */
  static async getTemplates(directory, enforceOptions) {
    const files = await readdir(directory);

    return await Promise.all(files
      .filter(function(file) {
        const ext = file.substr(file.lastIndexOf('.') + 1, file.length);
        return ext === 'html' || ext === 'MD' || ext === 'md';
      })
      .map(async function(file) {
        const ext = file.substr(file.lastIndexOf('.') + 1, file.length);
        const contents = await readFile(`${directory}/${file}`);
        const stats = await stat(`${directory}/${file}`);

        let { options, content } = parse(contents.toString('utf8'));
        if(!options && enforceOptions) throw new Error('post should contain options block as the first entry in the file');

        options.slug = `${file.substr(0, file.lastIndexOf('.'))}.html`;
        options.file = file.substr(0, file.lastIndexOf('.'));
        options.path = `${directory}/${file}`;
        options.content = ext === 'MD' || ext == 'md' ? Markdown.render(content) : content;
        options.date = new Date(options.date || stats.birthtime);

        return options;
      }));
  }
  /**
   * creates a new site
   * @method bootstrap
   * @memberof Site
   * @static
   * @param  {String}  destination - the path to the destination directory
   */
  static async bootstrap(destination) {
    await copyDirectory(path.resolve(__dirname, '..', 'test', 'fixtures'), destination);
  }
  /**
   * retrieves a config from the given directory
   * @method getConfig
   * @memberof Site
   * @param  {String}  directory - path of directory
   * @return {Object}  - config object
   */
  static async getConfig(directory) {
    async function resolve(config) {
      switch(typeof config) {
        case 'object':
          if(config instanceof Promise) {
            return await config();
          }
          return config;
        case 'function':
          return config();
      }
    }

    directory = path.resolve(directory);

    try {
      await stat(`${directory}/sweeney.js`);
      return await resolve(require(`${directory}/sweeney.js`));
    } catch(ex) {
      try {
        await stat(`${directory}/.sweenyrc`);
        return await resolve(require(`${directory}/.sweenyrc`));
      } catch(ex) {
        return {
          source: directory,
          output: `${directory}/site`
        };
      }
    }
  }
}

module.exports = Site;
