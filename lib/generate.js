const fs = require('fs');
const path = require('path');

const Template = require('./template');
const Markdown = require('./markdown');

const { parse } = require('./util');

function getPosts(directory) {
  const postsDir = path.resolve(directory);

  if (!fs.existsSync(postsDir)) throw new Error(`no posts found in ${postsDir}`);
  return fs.readdirSync(postsDir).map(function(file) {
    let { options, content } = parse(fs.readFileSync(postsDir + '/' + file).toString('utf8'));
    if(!options) throw new Error('post should contain options block as the first entry in the file');

    const entry = Markdown.parse(content);

    options.slug = `${file.substr(0, file.lastIndexOf('.'))}.html`;
    options.file = file.substr(0, file.lastIndexOf('.'));
    options.content = Markdown.toHTML(entry);
    options.date = new Date(options.date || '');

    return options;
  });
}

function getRootFile(directory) {
  return fs.readdirSync(directory)
    .filter((file) => {
      return file.substr(file.lastIndexOf('.') + 1, file.length) === 'html';
    }).map((file) => {
      let { options, content } = parse(fs.readFileSync(directory + '/' + file).toString('utf8'));

      const entry = Markdown.parse(content);

      options.file = file.substr(0, file.lastIndexOf('.'));
      options.content = Markdown.toHTML(entry);

      return options;
    });
}

function render(directory, file, opts, outputDirectory) {
  const tmpl = path.resolve(directory, `${file}.html`);
  const sourceDirectory = path.resolve(directory, 'layouts');
  
  const { options, content } = parse(fs.readFileSync(tmpl).toString('utf8'));

  if(options && options.layout) {
    return render(directory, `layouts/${options.layout}`, Object.assign({
      content: Template(content, opts, sourceDirectory, outputDirectory)
    }, opts), outputDirectory);
  }

  return Template(content, opts, sourceDirectory, outputDirectory);
}

// TODO: expose related articles
// TODO: expose next articles (can be configurable by default 3)
module.exports = function generate(directory, config) {
  const output = config.output ? path.resolve(directory, config.output) : path.resolve(directory, 'site');
  // make sure the output directory exists
  if(!fs.existsSync(output)) {
    fs.mkdirSync(output);
  }
  const posts = getPosts(directory + '/posts');

  posts.forEach((post) => {
    const out = render(directory, `layouts/${(post.template || 'post')}`, Object.assign({ post, page: {}, site: {} }, config), output);

    fs.writeFileSync(`${output}/${post.file}.html`, out);
  });

  // generate root level files
  const root = getRootFile(directory);

  root.forEach((r) => {
    const out = render(directory, r.file, Object.assign({ posts, page: {}, site: {} }, config), output);

    fs.writeFileSync(`${output}/${r.file}.html`, out);
  });
};
