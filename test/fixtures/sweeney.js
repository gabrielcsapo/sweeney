module.exports = {
  source: './',
  output: '../../docs',
  projects: [{
    name: 'sweeney',
    description: '💈 a blog aware, static site generator'
  }],
  site: {
    main: './index.html',
    title: 'template',
    description: 'this is a template site',
    user: {
      email: 'gabecsapo@gmail.com',
      github_username: '@gabrielcsapo',
      twitter_username: '@gabrielcsapo'
    },
    pages: [{
      title: 'About',
      url: './about.html'
    }, {
      title: 'Projects',
      url: './projects.html'
    }, {
      title: 'Source',
      url: 'http://github.com/gabrielcsapo/sweeney'
    }]
  }
};
