const fs = require('fs');
const path = require('path');
const test = require('tape');

const { promisify } = require('util');
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

const { ms, parse, ensureDirectoryExists, copyDirectory } = require('../lib/util');

test('util', (t) => {
  t.plan(4);

  t.test('@parse', (t) => {
    t.test('should be able to parse file with options', (t) => {
      let post = parse('---\n{ "layout": "post", "title": "Welcome to Jekyll!", "date": "2014-10-18 12:58:29", "categories": "jekyll update" }\n---\n# Hello world');

      t.deepEqual(post.options, {
        layout: 'post',
        title: 'Welcome to Jekyll!',
        date: '2014-10-18 12:58:29',
        categories: 'jekyll update'
      });
      t.equal(post.content, '# Hello world');

      t.end();
    });
  });

  t.test('@ensureDirectoryExists', (async (t) => {
    const dir = path.resolve(__dirname, 'tmp', 'really', 'not', 'here');
    await ensureDirectoryExists(dir);

    try {
      stat(dir);
      t.end();
    } catch(ex) {
      t.end(ex);
    }
  }));

  t.test('@copyDirectory', (async (t) => {
    await copyDirectory(path.resolve(__dirname, 'fixtures', 'posts'), path.resolve(__dirname, 'tmp', 'posts'));

    setTimeout(async function() {
      try {
        const files = await readdir(path.resolve(__dirname, 'tmp', 'posts'));
        t.equal(files.length, 1);
        t.end();
      } catch(ex) {
        t.end(ex);
      }
    }, 10);
  }));

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
