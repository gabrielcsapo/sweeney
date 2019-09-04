const path = require('path');

const { render: coreRender, parse: coreParse } = require('@sweeney/core/lib/util');

module.exports = {
  name: '@sweeney/plugin-include',
  parse: async function parse (filePath, content) {
    const reg = /{{-- includes (.+?) --}}/g;

    if (content.match(reg)) {
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

  render: async function render (plugins, filePath, content, templates, data, found) {
    let shouldRender = true;

    const start = process.hrtime();
    const ext = found.substring(found.lastIndexOf('.') + 1, found.length);
    const name = found.substring(found.lastIndexOf('/') + 1, found.length - 3);
    // if the template isn't registered (ie it is somewhere else on disk and not in the site directory) go and parse that file
    const _template = templates[name] || await coreParse(plugins, found);
    const depends = [];

    if (ext === 'css') {
      content = content.replace(`{{-- includes ${found} --}}`, `<style type="text/css">${_template.content}</style>`);

      // ensure this content gets added to the dependency tree
      depends.push({
        filePath: found,
        time: process.hrtime(start)[1] / 1000000
      });
    }

    if (ext === 'sy') {
      const passedData = Object.assign(data, {
        layout: '',
        depends: [],
        '@sweeney/plugin-include': []
      });

      const output = await coreRender(plugins, templates, _template, passedData);

      // ensure this template gets added to the dependency tree
      depends.push(output);

      if (_template.type === 'css') {
        shouldRender = false;
        content = content.replace(`{{-- includes ${found} --}}`, `<style type="text/css">${output.rendered}</style>`);
      } else {
        content = content.replace(`{{-- includes ${found} --}}`, output.rendered);
      }
    }

    return {
      depends,
      shouldRender,
      content
    };
  }
};
