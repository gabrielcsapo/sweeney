const test = require('tape');
const path = require('path');

const plugin = require('../index');

test('sweeney-plugin-editable', (t) => {
  t.plan(1);

  t.test('should be able to parse valid markup', async (t) => {
    const output = await plugin.parse(path.resolve(__dirname, 'fixtures', 'includes.sy'), `<html>
      <div>
        {{-- editable blue string --}}
      </div>
    </html>`);

    t.deepEqual(output, {
      content: '<html>\n        <div>\n          {{ blue }}\n        </div>\n      </html>',
      found: [{
        filePath: path.resolve(__dirname, 'fixtures', 'includes.sy'),
        variableName: 'blue',
        type: 'string'
      }]
    });

    t.end();
  });
});
