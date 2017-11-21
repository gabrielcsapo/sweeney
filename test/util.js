const test = require('tape');

const Util = require('../lib/util');

test('util', (t) => {
  t.plan(1);

  t.test('should be able to parse file with options', (t) => {
    let post = Util.parse(`---
{
"layout": "post",
"title": "Welcome to Jekyll!",
"date": "2014-10-18 12:58:29",
"categories": "jekyll update"
}
---

# Hello world
`);

    t.deepEqual(post.options, {
      layout: 'post',
      title: 'Welcome to Jekyll!',
      date: '2014-10-18 12:58:29',
      categories: 'jekyll update'
    });
    t.equal(post.content, '\n# Hello world\n');

    t.end();
  });

});
