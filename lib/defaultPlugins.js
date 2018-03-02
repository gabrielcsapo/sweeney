const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { render, parse } = require('./util');

const readFile = promisify(fs.readFile);

module.exports.includes = {
  parse: async function(filePath, content) {
    const reg = /{{-- includes (.+?) --}}/g;

    if(content.match(reg)) {
      const found = [];
      let block;
      while ((block = reg.exec(content)) != null) {
        const oldArgument = block[1];
        const newArgument = path.resolve(path.dirname(filePath), oldArgument);

        content = content.replace(`{{-- includes ${oldArgument} --}}`, `{{-- includes ${newArgument} --}}`);
        found.push(newArgument);
      }
      return {
        content,
        found
      };
    }
    return false;
  },
  render: async function(plugins, filePath, content, templates, data, found) {
    const start = process.hrtime();
    const ext = found.substring(found.lastIndexOf('.') + 1, found.length);
    const name = found.substring(found.lastIndexOf('/') + 1, found.length - 3);
    const _content = await readFile(found, 'utf8');
    const depends = [];

    if(ext === 'sy') {
      const passedData = Object.assign(data, {
        layout: '',
        depends: [],
        includes: []
      });

      // if the template isn't registered (ie it is somewhere else on disk and not in the site directory) go and parse that file
      const _template = templates[name] || await parse(plugins, found);
      const output = await render(plugins, templates, _template, passedData);

      // ensure this template gets added to the dependency tree
      depends.push(output);

      content = content.replace(`{{-- includes ${found} --}}`, output.rendered);
    }

    if(ext === 'css') {
      content = content.replace(`{{-- includes ${found} --}}`, `<style>${_content}</style>`);

      // ensure this content gets added to the dependency tree
      depends.push({
        filePath: found,
        time: process.hrtime(start)[1]/1000000
      });
    }

    return {
      depends,
      content
    };
  }
};
