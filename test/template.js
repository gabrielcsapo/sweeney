const fs = require('fs');
const path = require('path');
const test = require('tape');

const { parse } = require('../lib/util');

const Markdown = require('markdown-it')();
const Template = require('../lib/template');

test('template', (t) => {
  t.plan(4);

  t.test('should be able template basic data', (t) => {
      const template = new Template('<title> {{ page.title }} </title>');

      t.equal('<title> blue </title>', template.render({
        page: {
          title: 'blue'
        }
      }));
      t.end();
  });

  t.test('should be able template with additional functionality', (t) => {
      const template = new Template('<title> {{ decorate(page.title) }} </title>');

      t.equal('<title> !blue! </title>', template.render({
        decorate: (str) => `!${str}!`,
        page: {
          title: 'blue'
        }
      }));
      t.end();
  });

  t.test('should be able to render template from file', (t) => {
    const layout = fs.readFileSync(path.resolve(__dirname, 'fixtures', 'layouts', 'default.html')).toString('utf8');

    const template = new Template(layout, path.resolve(__dirname, 'fixtures', 'layouts'), path.resolve(__dirname, 'fixtures', 'site'));

    t.deepEqual('<!DOCTYPE html> <html>    <head>     <meta charset="utf-8">     <meta name="viewport" content="width=device-width initial-scale=1" />     <meta http-equiv="X-UA-Compatible" content="IE=edge">      <title>hello world</title>     <link rel="stylesheet" href="./site.css" >     <meta name="description" content="this is a template site"> </head>     <body style="display: flex;   min-height: 100vh;   flex-direction: column;   margin: 0 auto;">      <header class="site-header">   <a class="site-title" href="">template</a>    <nav class="site-nav">     <a class="page-link" href="http://github.com/gabrielcsapo/sweeney">Source</a>   </nav> </header>       <div class="page-content">       <div class="wrapper">         <b>hello world</b>       </div>     </div>      <footer class="site-footer">    <div style="display: flex;justify-content:center;">     <div> created with ☕️ by <a href="https://www.github.com/gabrielcsapo">Gabriel J. Csapo</a> </div>   </div>  </footer>     </body>  </html> ', template.render({
      page: {
        title: 'hello world'
      },
      site: {
        user: {
          name: 'Gabriel J. Csapo',
          github_url: 'https://www.github.com/gabrielcsapo'
        },
        title: 'template',
        description: 'this is a template site',
        pages: [{
          title: 'Source',
          url: 'http://github.com/gabrielcsapo/sweeney'
        }]
      },
      content: '<b>hello world</b>'
    }));
    t.end();
  });

  t.test('should be able to render template from file', (t) => {
    const layout = parse(fs.readFileSync(path.resolve(__dirname, 'fixtures', 'layouts', 'post.html')).toString('utf8'));
    const { options, content } = parse(fs.readFileSync(path.resolve(__dirname, 'fixtures', 'posts', '2017-11-20-welcome-to-sweeney.md')).toString('utf8'));

    options.content = Markdown.render(content);

    const template = new Template(layout.content, path.resolve(__dirname, 'fixtures', 'layouts'), path.resolve(__dirname, 'fixtures', 'layouts'));

    t.equal(template.render({ post: options }), '<div class="post">    <header class="post-header">     <h1 class="post-title">Welcome to Sweeney!</h1>     <p class="post-meta">2017-11-20 12:58:29  </p>     <small class="post-tags">sweeney, example</small>   </header>    <article class="post-content">     <p>You’ll find this post in your <code>_posts</code> directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run <code>sweeney serve --watch</code>, which launches a web server and auto-regenerates your site when a file is updated.</p>\n<p>To add new posts, simply add a file in the <code>_posts</code> directory that follows the convention <code>YYYY-MM-DD-name-of-post.ext</code> and includes the necessary options block.</p>\n<pre><code>---\n{\n  &quot;layout&quot;: &quot;post&quot;,\n  &quot;title&quot;: &quot;Welcome to Sweeney!&quot;,\n  &quot;date&quot;: &quot;2017-11-20 12:58:29&quot;,\n  &quot;tags&quot;: [&quot;sweeney&quot;, &quot;example&quot;]\n}\n---\n</code></pre>\n<p>Take a look at the source for this post to get an idea about how it works.</p>\n<table>\n<thead>\n<tr>\n<th>before</th>\n<th>after</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><code>hard</code></td>\n<td><code>easy</code></td>\n</tr>\n</tbody>\n</table>\n<p>There is also an option to override defaults with a <code>sweeney.js</code> in the root directory.</p>\n<pre><code class="language-javascript">module.exports = {\n  source: \'./\',\n  output: \'../../docs\',\n  ... // anything extra added to this file will be accessible via templates\n};\n</code></pre>\n<p>Check out the <a href="https://github.com/gabrielcsapo/sweeney">Sweeney docs</a> for more info on how to get the most out of Sweeney. File all bugs/feature requests at <a href="https://github.com/gabrielcsapo/sweeney">Sweeney’s GitHub repo</a>.</p>\n   </article>  </div> ');
    t.end();
  });

});
