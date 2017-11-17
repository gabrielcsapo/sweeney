const fs = require('fs');
const path = require('path');
const test = require('tape');

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
    }, path.resolve(__dirname, 'fixtures', 'layouts'));

    t.ok(typeof html === 'string');
    t.end();
  });

  t.test('should be able to render template from file', (t) => {
    const layout = fs.readFileSync(path.resolve(__dirname, 'fixtures', 'layouts', 'post.html')).toString('utf8');

    const post = Markdown.parse(fs.readFileSync(path.resolve(__dirname, 'fixtures', 'posts', '2014-10-18-welcome-to-jekyll.md')).toString('utf8'));

    let options = {
      post: post[0].body[0].content,
      content: Markdown.toHTML(post)
    };

    const html = template(layout, options, path.resolve(__dirname, 'fixtures', 'layouts'));
    t.equal(html, `<div class="post">    <header class="post-header">     <h1 class="post-title">Welcome to Jekyll!</h1>     <p class="post-meta">2014-10-18 12:58:29  </p>   </header>    <article class="post-content">     <br/><br/><p>
            You’ll find this post in your \`_posts\` directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run \`jekyll serve --watch\`, which launches a web server and auto-regenerates your site when a file is updated.
          </p><br/><br/><p>
            To add new posts, simply add a file in the \`_posts\` directory that follows the convention \`YYYY-MM-DD-name-of-post.ext\` and includes the necessary front matter. Take a look at the source for this post to get an idea about how it works.
          </p><br/><br/><p>
            Check out the <a type="link" href="jekyll">Jekyll docs</a> for more info on how to get the most out of Jekyll. File all bugs/feature requests at <a type="link" href="jekyll-gh">Jekyll’s GitHub repo</a>. If you have questions, you can ask them on <a type="link" href="jekyll-help">Jekyll’s dedicated Help repository</a>.
          </p><br/>   </article>  </div> `);
    t.end();
  });

});
