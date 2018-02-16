const fs = require('fs');
const path = require('path');
const test = require('tape');

const { promisify } = require('util');
const stat = promisify(fs.stat);

const { ms, merge, render, parse, parseString, getConfig, ensureDirectoryExists } = require('../lib/util');

test('util', (t) => {

  t.test('@merge', (t) => {
    t.plan(2);

    t.test('should be able to merge nested objects', (t) => {
      let merged = merge({ d: { t: 'hi' } }, { d: { f: 'b' } });

      t.deepEqual(merged, { d: { t: 'hi', f: 'b' } });
      t.end();
    });

    t.test('should be able to merge arrays of objects', (t) => {
      let merged = merge({ d: { t: 'hi', c: ['bob'] } }, { d: { f: 'b', c: ['foo', 'bar'] } });

      t.deepEqual(merged, { d: { t: 'hi', f: 'b', c: ['bob', 'foo', 'bar'] } });
      t.end();
    });
  });

  t.test('@render', (t) => {
    t.plan(2);

    t.test('should throw an error with template', async (t) => {
      const parsed = await parse(path.resolve(__dirname, './fixtures/throws-error.sy'));

      try {
        const rendered = await render([], parsed, {});
        t.fail(`${rendered} should not be rendered`);
      } catch (ex) {
        const error = JSON.parse(ex.message);

        t.deepEqual(Object.keys(error), ['error', 'content', 'stack']);
        t.equal(error.content, '<div>\n  <ul>\n    {{ tagss.map((tag) => `<li>${tag}</li>`)}}\n  </ul>\n</div>\n');
        t.equal(error.stack.substr(0, 36), 'ReferenceError: tagss is not defined');

        t.end();
      }
    });

    t.test('should render template properly', async (t) => {
      const parsed = await parse(path.resolve(__dirname, './fixtures/render.sy'));
      const rendered = await render([], parsed, {});

      t.equal(rendered, '<div>   <ul>     <li>sweeney</li><li>example</li>   </ul> </div> ');
      t.end();
    });
  });

  t.test('@parse', (t) => {
    t.plan(1);

    t.test('@parse: should be able to parse file with options', (async (t) => {
      const parsed = await parse(path.resolve(__dirname, './fixtures/test.sy'));

      t.deepEqual({
        path: '/Users/gabrielcsapo/Documents/sweeney/test/fixtures/test.sy',
        options: {
          title: 'Welcome to Sweeney!',
          tags: ['sweeney', 'example']
        },
        content: '<!DOCTYPE html>\n<html>\n\n{{-- includes /Users/gabrielcsapo/Documents/sweeney/test/partials/head.html --}}\n\n<body style="display: flex;\nmin-height: 100vh;\nflex-direction: column;\nmargin: 0 auto;">\n\n{{-- includes /Users/gabrielcsapo/Documents/sweeney/test/partials/header.html --}}\n\n<div class="page-content">\n  <div class="wrapper">\n    {{ content }}\n  </div>\n</div>\n\n{{-- includes /Users/gabrielcsapo/Documents/sweeney/test/partials/footer.html --}}\n\n</body>\n\n</html>\n',
        name: 'test',
        includes: ['/Users/gabrielcsapo/Documents/sweeney/test/partials/head.html',
          '/Users/gabrielcsapo/Documents/sweeney/test/partials/header.html',
          '/Users/gabrielcsapo/Documents/sweeney/test/partials/footer.html'
        ],
        collection: 'page',
        type: 'html'
      }, parsed);

      t.end();
    }));
  });

  t.test('@parseString', (t) => {
    t.plan(2);

    t.test('should be able to string with options', (t) => {
      let parsed = parseString('/foo/bar/something.sy', '---\n{ "layout": "post", "title": "Welcome to Jekyll!", "date": "2014-10-18 12:58:29", "categories": "jekyll update" }\n---\n# Hello world');

      t.equal(parsed.name, 'something');
      t.equal(parsed.layout, 'post');
      t.deepEqual(parsed.options, {
        layout: 'post',
        title: 'Welcome to Jekyll!',
        date: '2014-10-18 12:58:29',
        categories: 'jekyll update'
      });
      t.equal(parsed.content, '# Hello world');

      t.end();
    });

    t.test('should be able to parse sweeney tags', (t) => {
      let parsed = parseString('/foo/bar/default.sy', `---
{
  "title": "Welcome to Sweeney!",
  "tags": ["sweeney", "example"]
}
---
  <!DOCTYPE html>
  <html>

    {{-- includes ../partials/head.html --}}

    <body style="display: flex;
    min-height: 100vh;
    flex-direction: column;
    margin: 0 auto;">

      {{-- includes ../partials/header.html --}}

      <div class="page-content">
        <div class="wrapper">
          {{ content }}
        </div>
      </div>

      {{-- includes ../partials/footer.html --}}

    </body>

  </html>
`);

      t.deepEqual({
        name: 'default',
        includes: ['/foo/partials/head.html', '/foo/partials/header.html', '/foo/partials/footer.html'],
        collection: 'page',
        type: 'html',
        options: {
          title: 'Welcome to Sweeney!',
          tags: ['sweeney', 'example']
        },
        content: '  <!DOCTYPE html>\n  <html>\n\n    {{-- includes /foo/partials/head.html --}}\n\n    <body style="display: flex;\n    min-height: 100vh;\n    flex-direction: column;\n    margin: 0 auto;">\n\n      {{-- includes /foo/partials/header.html --}}\n\n      <div class="page-content">\n        <div class="wrapper">\n          {{ content }}\n        </div>\n      </div>\n\n      {{-- includes /foo/partials/footer.html --}}\n\n    </body>\n\n  </html>\n'
      }, parsed);

      t.end();
    });
  });

  t.test('@ensureDirectoryExists', (async (t) => {
    const dir = path.resolve(__dirname, 'tmp', 'really', 'not', 'here');

    await ensureDirectoryExists(dir);

    try {
      stat(dir);
      t.end();
    } catch (ex) {
      t.fail(ex);
    }
  }));

  t.test('@getConfig', (t) => {
    t.plan(4);

    t.test('should be able to read .sweeney file that exists', async (t) => {
      let dir = path.resolve(__dirname, 'fixtures', 'config', 'export');
      let config = await getConfig(dir);

      t.equal(typeof config, 'object');
      t.end();
    });

    t.test('should be able to read .sweeney file that returns a promise', async (t) => {
      let dir = path.resolve(__dirname, 'fixtures', 'config', 'promise');
      let config = await getConfig(dir);

      t.equal(typeof config, 'object');
      t.deepEqual(config, { foo: { hello: 'world' } });
      t.end();
    });

    t.test('should not throw an error if no config is found', async (t) => {
      try {
        let config = await getConfig(__dirname);
        t.deepEqual(config, {});
        t.end();
      } catch(ex) {
        t.fail(ex);
      }
    });

    t.test('should propogate error to user if the config has an error', async(t) => {
      let dir = path.resolve(__dirname, 'fixtures', 'config', 'throw');

      try {
        let config = await getConfig(dir);
        t.fail(config);
      } catch(ex) {
        t.equal(ex.message, 'I am broken!');
        t.ok(ex.stack.indexOf(dir) > -1, 'ensure the path to the config is in the error (retain the error object, don\'t alter it)');
        t.end();
      }
    });
  });

  t.test('@ms', (t) => {
    t.plan(4);

    t.test('@ms seconds', (t) => {
      t.equal(ms(6000), '6s');
      t.end();
    });

    t.test('@ms minutes', (t) => {
      t.equal(ms(600000), '10m');
      t.end();
    });

    t.test('@ms hours', (t) => {
      t.equal(ms(6000000), '1h');
      t.end();
    });

    t.test('@ms days', (t) => {
      t.equal(ms(600000000), '6d');
      t.end();
    });
  });

});
