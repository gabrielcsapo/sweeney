/* eslint-disable no-template-curly-in-string */

const test = require('tape')
const path = require('path')

const Site = require('../lib/site')

test('@site', (t) => {
  t.plan(3)

  t.test('should be able to get a instance of site without any data being passed to it', (t) => {
    const site = new Site()
    t.equal(site.source, path.resolve(__dirname, '..'))
    t.equal(site.output, path.resolve(__dirname, '..', 'site'))
    t.deepEqual(site.files, [])
    t.deepEqual(site.rendered, [])
    t.deepEqual(site.config, {})

    t.ok(site.plugins['editable'])
    t.ok(site.plugins['includes'])
    t.equal(typeof site.plugins['includes']['parse'], 'function')
    t.equal(typeof site.plugins['includes']['render'], 'function')

    t.end()
  })

  t.test('@crawl', (t) => {
    t.plan(1)

    t.test('should be able to crawl fixtures directory properly', async (t) => {
      const site = new Site({
        source: path.resolve(__dirname, 'fixtures'),
        output: path.resolve(__dirname, 'output')
      })

      await site.crawl()

      t.deepEqual(site.files, [{
        'filePath': `${path.resolve(__dirname, 'fixtures')}/depend.sy`,
        'outputPath': `${path.resolve(__dirname, 'output')}/depend.html`,
        'options': {
          'type': 'page'
        },
        'content': `\n<div>\n  {{-- includes ${path.resolve(__dirname, 'fixtures')}/render.sy --}}\n</div>\n`,
        'name': 'depend',
        'includes': [
          `${path.resolve(__dirname, 'fixtures')}/render.sy`
        ],
        'collection': 'page',
        'type': 'page'
      },
      {
        'filePath': `${path.resolve(__dirname, 'fixtures')}/includes.sy`,
        'outputPath': `${path.resolve(__dirname, 'output')}/includes.html`,
        'options': {
          'type': 'layout'
        },
        'content': `\n<!DOCTYPE html>\n<html>\n\n  <head>\n      <meta charset="utf-8">\n      <meta name="viewport" content="width=device-width initial-scale=1" />\n      <meta http-equiv="X-UA-Compatible" content="IE=edge">\n\n      <title>{{ options.title || site.title }}</title>\n      {{-- includes ${__dirname}/site.css --}}\n      <meta name="description" content="{{ site.description }}">\n  </head>\n\n\n  <body>\n    {{-- includes ${path.resolve(__dirname, 'fixtures')}/nav.sy --}}\n\n    <div class="top-rect"></div>\n    <div class="page">\n      <div class="page-centered-content">\n        {{ child }}\n      </div>\n\n      <div class="footer">\n        <div> created with ☕️ by <a class="footer-link" href="{{ site.user.github_url }}">{{ site.user.name }}</a> </div>\n      </div>\n    </div>\n  </body>\n\n</html>\n`,
        'name': 'includes',
        'includes': [
          `${path.resolve(__dirname)}/site.css`,
          `${path.resolve(__dirname, 'fixtures')}/nav.sy`
        ],
        'collection': 'page',
        'type': 'layout'
      },
      {
        'filePath': `${path.resolve(__dirname, 'fixtures')}/render.sy`,
        'outputPath': `${path.resolve(__dirname, 'output')}/render.html`,
        'options': {
          'title': 'Welcome to Sweeney!',
          'tags': [
            'sweeney',
            'example'
          ]
        },
        'content': '<div>\n  <div> {{ options.title }} </div>\n  <ul>\n    {{ options.tags.map((tag) => `<li>${tag}</li>`).join(\'\') }}\n  </ul>\n</div>\n',
        'editable': [
          {
            'filePath': '/Users/gabrielcsapo/Documents/sweeney/test/fixtures/render.sy',
            'variableName': 'options.title',
            'type': 'string'
          }
        ],
        'name': 'render',
        'collection': 'page',
        'type': 'html'
      },
      {
        'filePath': `${path.resolve(__dirname, 'fixtures')}/sub.sy`,
        'outputPath': `${path.resolve(__dirname, 'output')}/sub.html`,
        'options': {
          'type': 'page'
        },
        'content': `\n<div>\n  {{-- includes ${path.resolve(__dirname, 'fixtures')}/depend.sy --}}\n  {{-- includes ${path.resolve(__dirname, 'fixtures')}/render.sy --}}\n</div>\n`,
        'name': 'sub',
        'includes': [
          `${path.resolve(__dirname, 'fixtures')}/depend.sy`,
          `${path.resolve(__dirname, 'fixtures')}/render.sy`
        ],
        'collection': 'page',
        'type': 'page'
      },
      {
        'filePath': `${path.resolve(__dirname, 'fixtures')}/test.sy`,
        'outputPath': `${path.resolve(__dirname, 'output')}/test.html`,
        'options': {
          'title': 'Welcome to Sweeney!',
          'tags': [
            'sweeney',
            'example'
          ]
        },
        'content': `<!DOCTYPE html>\n<html>\n\n{{-- includes ${__dirname}/partials/head.html --}}\n\n<body style="display: flex;\nmin-height: 100vh;\nflex-direction: column;\nmargin: 0 auto;">\n\n{{-- includes ${__dirname}/partials/header.html --}}\n\n<div class="page-content">\n  <div class="wrapper">\n    {{ content }}\n  </div>\n</div>\n\n{{-- includes ${__dirname}/partials/footer.html --}}\n\n</body>\n\n</html>\n`,
        'name': 'test',
        'includes': [
          `${__dirname}/partials/head.html`,
          `${__dirname}/partials/header.html`,
          `${__dirname}/partials/footer.html`
        ],
        'collection': 'page',
        'type': 'html'
      },
      {
        'filePath': `${path.resolve(__dirname, 'fixtures')}/throws-error.sy`,
        'outputPath': `${path.resolve(__dirname, 'output')}/throws-error.html`,
        'options': {
          'title': 'Welcome to Sweeney!',
          'tags': [
            'sweeney',
            'example'
          ]
        },
        'content': '<div>\n  <ul>\n    {{ tagss.map((tag) => `<li>${tag}</li>`)}}\n  </ul>\n</div>\n',
        'name': 'throws-error',
        'collection': 'page',
        'type': 'html'
      }
      ])

      t.end()
    })
  })

  t.test('@categorize', (t) => {
    t.plan(1)

    t.test('should be able to categorize a mix of pages and layouts', (t) => {
      const site = new Site({
        source: path.resolve(__dirname, 'fixtures')
      })

      const files = [{
        'filePath': `${path.resolve(__dirname, 'fixtures')}/depend.sy`,
        'options': {
          'type': 'page'
        },
        'content': `\n<div>\n  {{-- includes ${path.resolve(__dirname, 'fixtures')}/render.sy --}}\n</div>\n`,
        'name': 'depend',
        'includes': [
          `${path.resolve(__dirname, 'fixtures')}/render.sy`
        ],
        'collection': 'page',
        'type': 'page'
      },
      {
        'filePath': `${path.resolve(__dirname, 'fixtures')}/includes.sy`,
        'options': {
          'type': 'layout'
        },
        'content': `\n<!DOCTYPE html>\n<html>\n\n  <head>\n      <meta charset="utf-8">\n      <meta name="viewport" content="width=device-width initial-scale=1" />\n      <meta http-equiv="X-UA-Compatible" content="IE=edge">\n\n      <title>{{ options.title || site.title }}</title>\n      {{-- includes ${__dirname}/site.css --}}\n      <meta name="description" content="{{ site.description }}">\n  </head>\n\n\n  <body>\n    {{-- includes ${path.resolve(__dirname, 'fixtures')}/nav.sy --}}\n\n    <div class="top-rect"></div>\n    <div class="page">\n      <div class="page-centered-content">\n        {{ child }}\n      </div>\n\n      <div class="footer">\n        <div> created with ☕️ by <a class="footer-link" href="{{ site.user.github_url }}">{{ site.user.name }}</a> </div>\n      </div>\n    </div>\n  </body>\n\n</html>\n`,
        'name': 'includes',
        'includes': [
          `${path.resolve(__dirname)}/site.css`,
          `${path.resolve(__dirname, 'fixtures')}/nav.sy`
        ],
        'collection': 'page',
        'type': 'layout'
      }
      ]

      t.deepEqual(site.categorize(files), {
        layouts: {
          includes: {
            'filePath': `${path.resolve(__dirname, 'fixtures')}/includes.sy`,
            'options': {
              'type': 'layout'
            },
            'content': `\n<!DOCTYPE html>\n<html>\n\n  <head>\n      <meta charset="utf-8">\n      <meta name="viewport" content="width=device-width initial-scale=1" />\n      <meta http-equiv="X-UA-Compatible" content="IE=edge">\n\n      <title>{{ options.title || site.title }}</title>\n      {{-- includes ${__dirname}/site.css --}}\n      <meta name="description" content="{{ site.description }}">\n  </head>\n\n\n  <body>\n    {{-- includes ${path.resolve(__dirname, 'fixtures')}/nav.sy --}}\n\n    <div class="top-rect"></div>\n    <div class="page">\n      <div class="page-centered-content">\n        {{ child }}\n      </div>\n\n      <div class="footer">\n        <div> created with ☕️ by <a class="footer-link" href="{{ site.user.github_url }}">{{ site.user.name }}</a> </div>\n      </div>\n    </div>\n  </body>\n\n</html>\n`,
            'name': 'includes',
            'includes': [
              `${path.resolve(__dirname)}/site.css`,
              `${path.resolve(__dirname, 'fixtures')}/nav.sy`
            ],
            'collection': 'page',
            'type': 'layout'
          }
        },
        pages: {
          [`${path.resolve(__dirname)}/fixtures/depend.sy`]: {
            'filePath': `${path.resolve(__dirname, 'fixtures')}/depend.sy`,
            'options': {
              'type': 'page'
            },
            'content': `\n<div>\n  {{-- includes ${path.resolve(__dirname, 'fixtures')}/render.sy --}}\n</div>\n`,
            'name': 'depend',
            'includes': [
              `${path.resolve(__dirname, 'fixtures')}/render.sy`
            ],
            'collection': 'page',
            'type': 'page'
          }
        }
      })

      t.end()
    })
  })
})
