const markdown = require('markdown-it')();

async function getProjects() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve([{
        name: 'sweeney',
        description: '💈 a blog aware, static site generator',
        url: 'http://www.gabrielcsapo.com/sweeney'
      }]);
    });
  });
}

module.exports = async function() {
  const projects = await getProjects();

  return {
    render: (type, content) => {
      if(type == 'markdown') {
        return markdown.render(content);
      }
      return content;
    },
    source: './',
    output: './site',
    projects,
    plugins: [
      require('@sweeney/plugin-editable'),
      require('@sweeney/plugin-include')
    ],
    site: {
      main: './index.html',
      title: 'Sweeney!',
      description: 'Welcome to your fresh cut site!',
      user: {
        name: 'Gabriel J. Csapo',
        github_url: 'https://www.github.com/gabrielcsapo'
      },
      colors: {
        'button-border':'#b3b3b3',
        'top-rect-start': '#1a1a1a',
        'top-rect-end': '#3e3e3e'
      }
    },
    include: [
      './sweeney.svg'
    ]
  };
};
