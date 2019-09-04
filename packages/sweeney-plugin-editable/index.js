module.exports = {
  name: '@sweeney/plugin-editable',
  parse: async function parse (filePath, content) {
    const reg = /{{-- editable (.+?) (string|number|color) --}}/g;

    if (content.match(reg)) {
      const found = [];
      let block;
      while ((block = reg.exec(content)) != null) {
        const variableName = block[1];
        const type = block[2];

        // the classic example value1 || value2
        if (variableName.indexOf('||') > -1) {
          const choices = variableName.split('||');

          choices.forEach((choice) => {
            found.push({
              filePath,
              variableName: choice.trim(),
              type
            });
          });
        } else {
          found.push({
            filePath,
            variableName,
            type
          });
        }

        // we want the parser to simply inject the required values back here, so just convert it to a basic variable template
        content = content.replace(new RegExp(`{{-- editable ${variableName} ${type} --}}`.replace(/([.*+?^=!:${}()|[\]\\])/g, '\\$1'), 'g'), `{{ ${variableName} }}`);
      }

      return {
        content,
        found
      };
    }

    return false;
  }
};
