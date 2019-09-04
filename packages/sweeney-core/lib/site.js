const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

const crawl = require('./crawl');
const { render, ensureDirectoryExists, getTotalTimeOfDepends } = require('./util');

class Site {
  /**
   * maintains the global state of a site
   * @class  Site
   * @param  {Object} config    - config options for the site
   */
  constructor (config = {}) {
    // this will determine if the contents of the build are built to the output directory or in memory
    this.inMemory = config.inMemory || false;
    this.source = config.source || process.cwd();
    this.output = config.output || path.resolve(process.cwd(), 'site');
    this.onBuild = typeof config.onBuild === 'function' ? config.onBuild : false;
    // holds all the rendered files, used for when figuring out the time it took for a specific template or what templates need to be re-rendered if a file is changed.
    this.rendered = [];
    // this is what is used as a top level object for each file being rendered
    // files content will also be interpolated into this value
    this.config = config || {};
    this.plugins = config.plugins || [];
  }

  /**
   * dynamically retrieves the files content
   * appropriately puts top level collections as root level keys
   * @method data
   * @memberof Site
   * @return {Object}
   */
  data (files) {
    const { config } = this;
    const d = {};

    files.forEach((file) => {
      const { options } = file;

      if (!d[options.collection]) d[options.collection] = [];

      d[options.collection].push(file);
    });

    return Object.assign(d, config);
  }
  /**
   * returns back pages and layouts as uncompiled templates
   * @method categorize
   * @memberof Site
   * @return {Object}   - returns an object with the keys `layout` and `pages` that are hashmaps
   */
  categorize (files) {
    const layouts = {};
    const pages = {};

    files.forEach((file) => {
      const { type, filePath, name } = file;

      switch (type) {
        case 'layout':
          // we are using the name of the file instead of the path for easier search and reference
          layouts[name] = file;
          break;
        default:
          pages[filePath] = file;
          break;
      }
    });

    return {
      layouts,
      pages
    };
  }
  /**
   * using the source directory, crawl all the necessary template files that will be ingested compiled
   * @method build
   * @memberof Site
   * @return {Promise}
   */
  async build () {
    // TODO: in the future this should intelligently build files depending on what has been done
    // reset in case there were files previously set
    this.rendered = [];

    const { output, source, plugins, inMemory, config } = this;

    await ensureDirectoryExists(output);
    const files = await crawl(plugins, output, source);
    const { layouts, pages } = this.categorize(files);
    const data = this.data(files);

    for (var key of Object.keys(pages)) {
      const page = pages[key];

      // If the user has provided a render method to handle different file types let them do that
      if (config.render && typeof config.render === 'function') {
        page.content = config.render(page.type, page.content);
      }

      const options = await render(plugins, layouts, page, data);

      this.rendered.push({
        filePath: page.outputPath,
        data: options.data,
        time: getTotalTimeOfDepends(options.depends),
        depends: options.depends,
        rendered: options.rendered
      });

      if (!inMemory && options.shouldRender) {
        await ensureDirectoryExists(path.dirname(page.outputPath));
        await writeFile(page.outputPath, options.rendered);
      }
    }

    if (typeof this.onBuild === 'function') {
      this.onBuild();
    }
  }
}

module.exports = Site;
