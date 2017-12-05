const fs = require('fs');
const path = require('path');
const test = require('tape');

const { parse } = require('../lib/util');

const Markdown = require('markdown-it')();
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

    options.content = Markdown.render(content);

    const html = template(layout.content, { post: options }, path.resolve(__dirname, 'fixtures', 'layouts'), path.resolve(__dirname, 'fixtures', 'layouts'));
    t.equal(html, '<div class="post">    <header class="post-header">     <h1 class="post-title">Welcome to Sweeney!</h1>     <p class="post-meta">2017-11-20 12:58:29  </p>     <small class="post-tags">sweeney, example</small>   </header>    <article class="post-content">     <p>You’ll find this post in your <code>_posts</code> directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run <code>sweeney serve --watch</code>, which launches a web server and auto-regenerates your site when a file is updated.</p>\n<p>To add new posts, simply add a file in the <code>_posts</code> directory that follows the convention <code>YYYY-MM-DD-name-of-post.ext</code> and includes the necessary options block.</p>\n<pre><code>---\n{\n  &quot;layout&quot;: &quot;post&quot;,\n  &quot;title&quot;: &quot;Welcome to Sweeney!&quot;,\n  &quot;date&quot;: &quot;2017-11-20 12:58:29&quot;,\n  &quot;tags&quot;: [&quot;sweeney&quot;, &quot;example&quot;]\n}\n---\n</code></pre>\n<p>Take a look at the source for this post to get an idea about how it works.</p>\n<table>\n<thead>\n<tr>\n<th>before</th>\n<th>after</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><code>hard</code></td>\n<td><code>easy</code></td>\n</tr>\n</tbody>\n</table>\n<p>There is also an option to override defaults with a <code>sweeney.js</code> in the root directory.</p>\n<pre><code class="language-javascript">module.exports = {\n  source: \'./\',\n  output: \'../../docs\',\n  ... // anything extra added to this file will be accessible via templates\n};\n</code></pre>\n<p>Check out the <a href="https://github.com/gabrielcsapo/sweeney">Sweeney docs</a> for more info on how to get the most out of Sweeney. File all bugs/feature requests at <a href="https://github.com/gabrielcsapo/sweeney">Sweeney’s GitHub repo</a>.</p>\n   </article>  </div> ');
    t.end();
  });

});
