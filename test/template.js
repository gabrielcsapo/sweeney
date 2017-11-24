const fs = require('fs');
const path = require('path');
const test = require('tape');

const { parse } = require('../lib/util');

const Markdown = require('../lib/markdown');
const template = require('../lib/template');

test('template', (t) => {
  t.plan(4);

  t.test('should be able template basic data', (t) => {
      const html = template('<title> {{ page.title }} </title>', {
        page: {
          title: 'blue'
        }
      });

      t.equal('<title> blue </title>', html);
      t.end();
  });

  t.test('should be able template with additional functionality', (t) => {
      const html = template('<title> {{ decorate(page.title) }} </title>', {
        decorate: (str) => `!${str}!`,
        page: {
          title: 'blue'
        }
      });

      t.equal('<title> !blue! </title>', html);
      t.end();
  });

  t.test('should be able to render template from file', (t) => {
    const layout = fs.readFileSync(path.resolve(__dirname, 'fixtures', 'layouts', 'default.html')).toString('utf8');

    const html = template(layout, {
      page: {
        title: 'hello world'
      },
      site: {
        user: {
          email: 'gabecsapo@gmail.com',
          github_username: '@gabrielcsapo',
          twitter_username: '@gabrielcsapo'
        },
        title: 'template',
        description: 'this is a template site',
        pages: [{
          title: 'Source',
          url: 'http://github.com/gabrielcsapo/sweeney'
        }]
      },
      content: '<b>hello world</b>'
    }, path.resolve(__dirname, 'fixtures', 'layouts'), path.resolve(__dirname, 'fixtures', 'site'));

    t.ok(typeof html === 'string');
    t.end();
  });

  t.test('should be able to render template from file', (t) => {
    const layout = parse(fs.readFileSync(path.resolve(__dirname, 'fixtures', 'layouts', 'post.html')).toString('utf8'));
    const { options, content } = parse(fs.readFileSync(path.resolve(__dirname, 'fixtures', 'posts', '2017-11-20-welcome-to-sweeney.md')).toString('utf8'));

    options.content = Markdown.toHTML(Markdown.parse(content));

    const html = template(layout.content, { post: options }, path.resolve(__dirname, 'fixtures', 'layouts'), path.resolve(__dirname, 'fixtures', 'layouts'));
    t.equal(html, '<div class="post">    <header class="post-header">     <h1 class="post-title">Welcome to Sweeney!</h1>     <p class="post-meta">2017-11-20 12:58:29  </p>     <small class="post-tags">sweeney, example</small>   </header>    <article class="post-content">     <br/><p>\n            You’ll find this post in your <code>_posts</code> directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run <code>sweeney serve --watch</code>, which launches a web server and auto-regenerates your site when a file is updated.\n          </p><br/><br/><p>\n            To add new posts, simply add a file in the <code>_posts</code> directory that follows the convention <code>YYYY-MM-DD-name-of-post.ext</code> and includes the necessary options block. \n          </p><br/><br/><pre><code>---\n{\n  "layout": "post",\n  "title": "Welcome to Sweeney!",\n  "date": "2017-11-20 12:58:29",\n  "tags": ["sweeney", "example"]\n}\n---</code></pre><p>\n            Take a look at the source for this post to get an idea about how it works.\n          </p><br/><br/><table>\n            <tr>\n              <th><p>\n            before\n          </p></th><th><p>\n            after\n          </p></th>\n            <tr>\n            <tr>\n                  <td><p>\n            <code>hard</code>\n          </p></td><td><p>\n            <code>easy</code>\n          </p></td>\n                </tr>\n          </table><p>\n            Check out the <a type="link" href="https://github.com/gabrielcsapo/sweeney">Sweeney docs</a> for more info on how to get the most out of Sweeney. File all bugs/feature requests at <a type="link" href="https://github.com/gabrielcsapo/sweeney">Sweeney’s GitHub repo</a>.\n          </p><br/>   </article>  </div> ');
    t.end();
  });

});
