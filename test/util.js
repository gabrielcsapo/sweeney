const fs = require('fs');
const path = require('path');
const test = require('tape');

const { promisify } = require('util');
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

const {
  ms,
  merge,
  render,
  parse,
  parseString,
  getConfig,
  ensureDirectoryExists,
  renderSubDepends,
  getTotalTimeOfDepends,
  copyDirectory
} = require('../lib/util');

const defaultPlugins = require('../lib/defaultPlugins');

test('util', (t) => {

  t.test('@merge', (t) => {
    t.plan(2);

    t.test('should be able to merge nested objects', (t) => {
      const merged = merge({
        d: {
          t: 'hi'
        }
      }, {
        d: {
          f: 'b'
        }
      });

      t.deepEqual(merged, {
        d: {
          t: 'hi',
          f: 'b'
        }
      });
      t.end();
    });

    t.test('should be able to merge arrays of objects', (t) => {
      const merged = merge({
        d: {
          t: 'hi',
          c: ['bob']
        }
      }, {
        d: {
          f: 'b',
          c: ['foo', 'bar']
        }
      });

      t.deepEqual(merged, {
        d: {
          t: 'hi',
          f: 'b',
          c: ['bob', 'foo', 'bar']
        }
      });
      t.end();
    });
  });

  t.test('@render', (t) => {
    t.plan(3);

    t.test('should throw an error with template', async (t) => {
      const parsed = await parse(defaultPlugins, path.resolve(__dirname, './fixtures/throws-error.sy'));

      try {
        const rendered = await render(defaultPlugins, [], parsed, {});
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
      const parsed = await parse(defaultPlugins, path.resolve(__dirname, './fixtures/render.sy'));
      const rendered = await render(defaultPlugins, [], parsed, {});

      t.deepEqual(Object.keys(rendered), ['filePath', 'rendered', 'depends', 'time']);
      t.equal(typeof rendered.time, 'number');
      t.deepEqual(rendered.depends, []);
      t.equal(rendered.rendered, '<div>   <ul>     <li>sweeney</li><li>example</li>   </ul> </div> ');
      t.equal(rendered.filePath, path.resolve(__dirname, './fixtures/render.sy'));

      t.end();
    });

    t.test('should be able to properly add depends to template when rendering sub templates', async (t) => {
      const parsed = await parse(defaultPlugins, path.resolve(__dirname, './fixtures/sub.sy'));
      const rendered = await render(defaultPlugins, [], parsed, {});

      t.equal(rendered.filePath, path.resolve(__dirname, './fixtures/sub.sy'));
      t.equal(rendered.rendered, ' <div>    <div>   <div>   <ul>     <li>sweeney</li><li>example</li>   </ul> </div>  </div>    <div>   <ul>     <li>sweeney</li><li>example</li><li>sweeney</li><li>example</li>   </ul> </div>  </div> ');
      t.equal(rendered.depends.length, 2);
      t.equal(rendered.depends[0].filePath, path.resolve(__dirname, './fixtures/depend.sy'));
      t.equal(rendered.depends[0].rendered, ' <div>   <div>   <ul>     <li>sweeney</li><li>example</li>   </ul> </div>  </div> ');
      t.equal(rendered.depends[0].depends.length, 1);
      t.equal(rendered.depends[0].depends[0].filePath, path.resolve(__dirname, './fixtures/render.sy'));
      t.equal(rendered.depends[0].depends[0].rendered, '<div>   <ul>     <li>sweeney</li><li>example</li>   </ul> </div> ');
      t.equal(rendered.depends[0].depends[0].depends.length, 0);

      t.equal(rendered.depends[1].filePath, path.resolve(__dirname, './fixtures/render.sy'));
      t.equal(rendered.depends[1].rendered, '<div>   <ul>     <li>sweeney</li><li>example</li><li>sweeney</li><li>example</li>   </ul> </div> ');
      t.equal(rendered.depends[1].depends.length, 0);
      t.end();
    });
  });

  t.test('@parse', (t) => {
    t.plan(1);

    t.test('@parse: should be able to parse file with options', (async (t) => {
      const parsed = await parse(defaultPlugins, path.resolve(__dirname, './fixtures/test.sy'));

      t.deepEqual({
        filePath: path.resolve(__dirname, 'fixtures/test.sy'),
        options: {
          title: 'Welcome to Sweeney!',
          tags: ['sweeney', 'example']
        },
        content: `<!DOCTYPE html>\n<html>\n\n{{-- includes ${path.resolve(__dirname, 'partials/head.html')} --}}\n\n<body style="display: flex;\nmin-height: 100vh;\nflex-direction: column;\nmargin: 0 auto;">\n\n{{-- includes ${path.resolve(__dirname, 'partials/header.html')} --}}\n\n<div class="page-content">\n  <div class="wrapper">\n    {{ content }}\n  </div>\n</div>\n\n{{-- includes ${path.resolve(__dirname, 'partials/footer.html')} --}}\n\n</body>\n\n</html>\n`,
        name: 'test',
        includes: [
          path.resolve(__dirname, 'partials/head.html'),
          path.resolve(__dirname, 'partials/header.html'),
          path.resolve(__dirname, 'partials/footer.html')
        ],
        collection: 'page',
        type: 'html'
      }, parsed);

      t.end();
    }));
  });

  t.test('@parseString', (t) => {
    t.plan(3);

    t.test('should be able to string with options', async (t) => {
      const parsed = await parseString(defaultPlugins, '/foo/bar/something.sy', '---\n{ "layout": "post", "title": "Welcome to Jekyll!", "date": "2014-10-18 12:58:29", "categories": "jekyll update" }\n---\n# Hello world');

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

    t.test('should be able to parse sweeney tags', async (t) => {
      const parsed = await parseString(defaultPlugins, '/foo/bar/default.sy', `---
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

    t.test('should work with custom plugins object', async (t) => {
      const parsed = await parseString({
        test: {
          parse(filePath, content) {
            const reg = /{{-- test\('(.+?)'\) --}}/g;

            if (content.match(reg)) {
              const found = [];
              let block;
              while ((block = reg.exec(content)) != null) {
                found.push(block[1]);
              }
              return {
                content,
                found
              };
            }
            return false;
          }
        }
      }, '/foo/bar/default.sy', `
        <div>
          {{-- test('should do something') --}}
        </div>
      `);

      t.deepEqual(parsed, {
        name: 'default',
        test: ['should do something']
      });

      t.end();
    });
  });

  t.test('@ensureDirectoryExists', (async (t) => {
    const dir = path.resolve(__dirname, 'tmp', 'really', 'not', 'here');

    await ensureDirectoryExists(dir);

    try {
      await stat(dir);
      t.end();
    } catch (ex) {
      t.fail(ex);
    }
  }));

  t.test('@getConfig', (t) => {
    t.plan(4);

    t.test('should be able to read .sweeney file that exists', async (t) => {
      const dir = path.resolve(__dirname, 'fixtures', 'config', 'export');
      const config = await getConfig(dir);

      t.equal(typeof config, 'object');
      t.end();
    });

    t.test('should be able to read .sweeney file that returns a promise', async (t) => {
      const dir = path.resolve(__dirname, 'fixtures', 'config', 'promise');
      const config = await getConfig(dir);

      t.equal(typeof config, 'object');
      t.deepEqual(config, {
        foo: {
          hello: 'world'
        }
      });
      t.end();
    });

    t.test('should not throw an error if no config is found', async (t) => {
      try {
        const config = await getConfig(__dirname);
        t.deepEqual(config, {});
        t.end();
      } catch (ex) {
        t.fail(ex);
      }
    });

    t.test('should propogate error to user if the config has an error', async (t) => {
      const dir = path.resolve(__dirname, 'fixtures', 'config', 'throw');

      try {
        const config = await getConfig(dir);
        t.fail(config);
      } catch (ex) {
        t.equal(ex.message, 'I am broken!');
        t.ok(ex.stack.indexOf(dir) > -1, 'ensure the path to the config is in the error (retain the error object, don\'t alter it)');
        t.end();
      }
    });
  });

  t.test('@copyDirectory', (t) => {
    t.plan(1);

    t.test('should be able to copy example directory and all its content', async (t) => {
      const destination = path.resolve(__dirname, 'tmp', 'copy');
      const source = path.resolve(__dirname, '..', 'example');
      await copyDirectory(source, destination);

      const files = await readdir(destination);

      t.deepEqual(files, [
        '.sweeney',
        'about.sy',
        'index.sy',
        'layouts',
        'posts',
        'posts.sy',
        'projects.sy',
        'site.css',
        'sweeney.svg'
      ]);

      // ensure sub directories have files
      const subFiles = await readdir(path.resolve(destination, 'layouts'));

      t.deepEqual(subFiles, [
        'default.sy',
        'nav.sy',
        'page.sy',
        'post.sy'
      ]);

      t.end();
    });
  });

  t.test('@getTotalTimeOfDepends', (t) => {
    t.plan(1);

    const rendered = {
      filePath: 'foo',
      time: 100,
      depends: [{
        filePath: 'boo',
        time: 150,
        depends: [{
          filePath: 'let',
          time: 250,
          depends: [{
            filePath: 'hoooot',
            time: 330
          }]
        }]
      }, {
        filePath: 'hoo',
        time: 130,
        depends: [{
          filePath: 'hoot',
          time: 50
        }]
      }]
    };

    t.test('should be able to get all of the times aggregated', (t) => {
      const time = getTotalTimeOfDepends(rendered);
      t.equal(time, 1010);
      t.end();
    });

  });

  t.test('@renderSubDepends', (t) => {
    t.plan(4);

    const rendered = {
      filePath: 'foo',
      time: 100,
      depends: [{
        filePath: 'boo',
        time: 150,
        depends: [{
          filePath: 'let',
          time: 250,
          depends: [{
            filePath: 'hoooot',
            time: 330
          }]
        }]
      }, {
        filePath: 'hoo',
        time: 130,
        depends: [{
          filePath: 'hoot',
          time: 50
        }]
      }]
    };

    t.test('should be able to resolve recursive dependencies', (t) => {
      const output = renderSubDepends(rendered, 0);

      t.equal(output, '\n foo [100ms]\n  - boo [150ms]\n    - let [250ms]\n      - hoooot [330ms]\n  - hoo [130ms]\n    - hoot [50ms]');

      t.end();
    });

    t.test('should work when no starting level is given (default 0)', (t) => {
      const output = renderSubDepends(rendered);

      t.equal(output, '\n foo [100ms]\n  - boo [150ms]\n    - let [250ms]\n      - hoooot [330ms]\n  - hoo [130ms]\n    - hoot [50ms]');

      t.end();
    });

    t.test('should honor offset starting level at 1', (t) => {
      const output = renderSubDepends(rendered, 1);

      t.equal(output, '\n  - foo [100ms]\n    - boo [150ms]\n      - let [250ms]\n        - hoooot [330ms]\n    - hoo [130ms]\n      - hoot [50ms]');

      t.end();
    });

    t.test('should work with array of files', (t) => {
      const rendered = [{
          filePath: '~/sweeney/example/about.sy',
          depends: {
            filePath: '~/sweeney/example/layouts/default.sy',
            time: 0.63868
          },
          time: 0.932518
        },
        {
          filePath: '~/sweeney/example/index.sy',
          depends: {
            filePath: '~/sweeney/example/layouts/default.sy',
            time: 0.505146
          },
          time: 0.820841
        },
        {
          filePath: '~/sweeney/example/posts/2017-11-20-welcome-to-sweeney.sy',
          depends: {
            filePath: '~/sweeney/example/layouts/post.sy',
            depends: [{
              filePath: '~/sweeney/example/index.sy',
              depends: {
                filePath: '~/sweeney/example/layouts/default.sy',
                time: 0.505146
              },
              time: 0.820841
            }],
            time: 1.35372
          },
          time: 1.84443
        },
        {
          filePath: '~/sweeney/example/posts.sy',
          depends: {
            filePath: '~/sweeney/example/layouts/default.sy',
            time: 1.0139
          },
          time: 2.090657
        },
        {
          filePath: '~/sweeney/example/projects.sy',
          depends: {
            filePath: '~/sweeney/example/layouts/default.sy',
            time: 0.482915
          },
          time: 0.934869
        }
      ];

      const output = renderSubDepends(rendered, 1);

      t.equal(output, '\n  - ~/sweeney/example/about.sy [0.9325ms]\n    - ~/sweeney/example/layouts/default.sy [0.6387ms]\n  - ~/sweeney/example/index.sy [0.8208ms]\n    - ~/sweeney/example/layouts/default.sy [0.5051ms]\n  - ~/sweeney/example/posts/2017-11-20-welcome-to-sweeney.sy [1.8444ms]\n    - ~/sweeney/example/layouts/post.sy [1.3537ms]\n      - ~/sweeney/example/index.sy [0.8208ms]\n        - ~/sweeney/example/layouts/default.sy [0.5051ms]\n  - ~/sweeney/example/posts.sy [2.0907ms]\n    - ~/sweeney/example/layouts/default.sy [1.0139ms]\n  - ~/sweeney/example/projects.sy [0.9349ms]\n    - ~/sweeney/example/layouts/default.sy [0.4829ms]');

      t.end();
    });
  });

  t.test('@ms', (t) => {
    t.plan(5);

    t.test('milleseconds', (t) => {
      t.equal(ms(600), '600ms');
      t.end();
    });

    t.test('seconds', (t) => {
      t.equal(ms(6000), '6s');
      t.end();
    });

    t.test('minutes', (t) => {
      t.equal(ms(600000), '10m');
      t.end();
    });

    t.test('hours', (t) => {
      t.equal(ms(6000000), '1h');
      t.end();
    });

    t.test('days', (t) => {
      t.equal(ms(600000000), '6d');
      t.end();
    });
  });

});
