module.exports = {
  source: './',
  output: './docs',
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
      title: 'Source',
      url: 'http://github.com/gabrielcsapo/sweeney'
    }]
  }
};
