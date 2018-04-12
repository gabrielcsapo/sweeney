const path = require('path')

const { render, parse } = require('./util')

module.exports.editable = {
  parse: async function (filePath, content) {
    const reg = /{{-- editable (.+?) (string|number|color) --}}/g

    if (content.match(reg)) {
      const found = []
      let block
      while ((block = reg.exec(content)) != null) {
        const variableName = block[1]
        const type = block[2]

        // the classic example value1 || value2
        if (variableName.indexOf('||') > -1) {
          const choices = variableName.split('||')

          choices.forEach((choice) => {
            found.push({
              filePath,
              variableName: choice.trim(),
              type
            })
          })
        } else {
          found.push({
            filePath,
            variableName,
            type
          })
        }

        // we want the parser to simply inject the required values back here, so just convert it to a basic variable template
        content = content.replace(new RegExp(`{{-- editable ${variableName} ${type} --}}`.replace(/([.*+?^=!:${}()|[\]\\])/g, '\\$1'), 'g'), `{{ ${variableName} }}`)
      }
      return {
        content,
        found
      }
    }
    return false
  }
}

module.exports.includes = {
  parse: async function (filePath, content) {
    const reg = /{{-- includes (.+?) --}}/g

    if (content.match(reg)) {
      const found = []
      let block
      while ((block = reg.exec(content)) != null) {
        const oldArgument = block[1]
        const newArgument = path.resolve(path.dirname(filePath), oldArgument)

        content = content.replace(`{{-- includes ${oldArgument} --}}`, `{{-- includes ${newArgument} --}}`)
        found.push(newArgument)
      }
      return {
        content,
        found
      }
    }
    return false
  },
  render: async function (plugins, filePath, content, templates, data, found) {
    const start = process.hrtime()
    const ext = found.substring(found.lastIndexOf('.') + 1, found.length)
    const name = found.substring(found.lastIndexOf('/') + 1, found.length - 3)
    // if the template isn't registered (ie it is somewhere else on disk and not in the site directory) go and parse that file
    const _template = templates[name] || await parse(plugins, found)
    const depends = []

    if (ext === 'css') {
      content = content.replace(`{{-- includes ${found} --}}`, `<style type="text/css">${_template.content}</style>`)

      // ensure this content gets added to the dependency tree
      depends.push({
        filePath: found,
        time: process.hrtime(start)[1] / 1000000
      })
    }

    if (ext === 'sy') {
      const passedData = Object.assign(data, {
        layout: '',
        depends: [],
        includes: []
      })

      const output = await render(plugins, templates, _template, passedData)

      // ensure this template gets added to the dependency tree
      depends.push(output)

      if (_template.type === 'css') {
        content = content.replace(`{{-- includes ${found} --}}`, `<style type="text/css">${output.rendered}</style>`)
      } else {
        content = content.replace(`{{-- includes ${found} --}}`, output.rendered)
      }
    }

    return {
      depends,
      content
    }
  }
}
