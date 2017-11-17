module.exports = {
  source: './',
  output: './docs',
  site: {
    title: 'template',
    description: 'this is a template site',
    user: {
      email: 'gabecsapo@gmail.com',
      github_username: '@gabrielcsapo',
      twitter_username: '@gabrielcsapo'
    },
    pages: [{
      title: 'Source',
      url: 'http://github.com/gabrielcsapo/sweeney'
    }]
  },
  content: '<b>hello world</b>'
};
