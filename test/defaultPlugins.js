const test = require('tape')
const path = require('path')

const defaultPlugins = require('../lib/defaultPlugins')

test('@defaultPlugins', (t) => {
  t.plan(2)

  t.test('@editable', (t) => {
    t.plan(1)

    t.test('should be able to parse valid markup', async (t) => {
      const parse = defaultPlugins['editable'].parse

      const output = await parse(path.resolve(__dirname, 'fixtures', 'includes.sy'), `<html>
        <div>
          {{-- editable blue string --}}
        </div>
      </html>`)

      t.deepEqual(output, {
        content: '<html>\n        <div>\n          {{ blue }}\n        </div>\n      </html>',
        found: [{
          filePath: path.resolve(__dirname, 'fixtures', 'includes.sy'),
          variableName: 'blue',
          type: 'string'
        }]
      })

      t.end()
    })
  })

  t.test('@includes', (t) => {
    t.plan(2)

    t.test('should parse file with css and sy paths correctly', async (t) => {
      const parse = defaultPlugins['includes'].parse

      const output = await parse(path.resolve(__dirname, 'fixtures', 'includes.sy'), `<!DOCTYPE html>
      <html>

        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width initial-scale=1" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge">

            <title>{{ options.title || site.title }}</title>
            {{-- includes ../site.css --}}
            <meta name="description" content="{{ site.description }}">
        </head>


        <body>
          {{-- includes ./nav.sy --}}

          <div class="top-rect"></div>
          <div class="page">
            <div class="page-centered-content">
              {{ child }}
            </div>

            <div class="footer">
              <div> created with ☕️ by <a class="footer-link" href="{{ site.user.github_url }}">{{ site.user.name }}</a> </div>
            </div>
          </div>
        </body>

      </html>`)

      t.deepEqual(output, {
        content: `<!DOCTYPE html>\n      <html>\n\n        <head>\n            <meta charset="utf-8">\n            <meta name="viewport" content="width=device-width initial-scale=1" />\n            <meta http-equiv="X-UA-Compatible" content="IE=edge">\n\n            <title>{{ options.title || site.title }}</title>\n            {{-- includes ${path.resolve(__dirname)}/site.css --}}\n            <meta name="description" content="{{ site.description }}">\n        </head>\n\n\n        <body>\n          {{-- includes ${path.resolve(__dirname)}/fixtures/nav.sy --}}\n\n          <div class="top-rect"></div>\n          <div class="page">\n            <div class="page-centered-content">\n              {{ child }}\n            </div>\n\n            <div class="footer">\n              <div> created with ☕️ by <a class="footer-link" href="{{ site.user.github_url }}">{{ site.user.name }}</a> </div>\n            </div>\n          </div>\n        </body>\n\n      </html>`,
        found: [
          path.resolve(__dirname, 'site.css'),
          path.resolve(__dirname, 'fixtures', 'nav.sy')
        ]
      })

      t.end()
    })

    t.test('should be able to render parsed template', async (t) => {
      const render = defaultPlugins['includes'].render

      const output = await render({
        includes: defaultPlugins['includes']
      },
      path.resolve(__dirname, 'fixtures', 'includes.sy'),
      `<!DOCTYPE html>\n      <html>\n\n        <head>\n            <meta charset="utf-8">\n            <meta name="viewport" content="width=device-width initial-scale=1" />\n            <meta http-equiv="X-UA-Compatible" content="IE=edge">\n\n            <title>{{ options.title || site.title }}</title>\n            {{-- includes ${path.resolve(__dirname)}/fixtures/test.css --}}\n            <meta name="description" content="{{ site.description }}">\n        </head>\n\n\n        <body>\n          {{-- includes ${path.resolve(__dirname)}/fixtures/nav.sy --}}\n\n          <div class="top-rect"></div>\n          <div class="page">\n            <div class="page-centered-content">\n              {{ child }}\n            </div>\n\n            <div class="footer">\n              <div> created with ☕️ by <a class="footer-link" href="{{ site.user.github_url }}">{{ site.user.name }}</a> </div>\n            </div>\n          </div>\n        </body>\n\n      </html>`, [], {},
      path.resolve(__dirname, 'fixtures', 'test.css')
      )

      t.deepEqual(output.depends.length, 1)
      t.equal(output.depends[0].filePath, path.resolve(__dirname, 'fixtures', 'test.css'))

      t.deepEqual(output.content, `<!DOCTYPE html>\n      <html>\n\n        <head>\n            <meta charset="utf-8">\n            <meta name="viewport" content="width=device-width initial-scale=1" />\n            <meta http-equiv="X-UA-Compatible" content="IE=edge">\n\n            <title>{{ options.title || site.title }}</title>\n            <style type="text/css">* {\n  font-family: Baskerville;\n  font-weight: normal;\n}\n\nhtml, body {\n  width: 100%;\n  height: 100%;\n  margin: 0;\n  padding: 0;\n}\n\n.top-rect {\n  width: 100%;\n  padding-top: 300px;\n  position: absolute;\n  top: 0;\n  right: 0;\n  z-index: -1;\n  background: linear-gradient(to bottom right, #3e3e3e, #1a1a1a);\n  overflow: hidden;\n  overflow-x: hidden;\n  overflow-y: hidden;\n}\n\n.top-rect:after {\n  content: "";\n  display: block;\n  background: #fff;\n  height: 300px;\n  width: 8000px;\n  position: absolute;\n  z-index: 1;\n  bottom: -50%;\n  right: 50%;\n  margin-right: -4000px;\n  -webkit-transform: rotate(6deg);\n  transform: rotate(6deg);\n}\n\n.sweeney {\n  font-family: Baskerville;\n  font-weight: 600;\n  font-style: italic;\n  margin: 5px;\n}\n\n.sweeney-title {\n  font-size: 40px;\n}\n\n.sweeney-version {\n  color: #797877;\n  text-decoration-color: #797877;\n}\n\n.sweeney-description {\n  font-size: 19px;\n  font-weight: 300;\n}\n\n.sweeney-logo {\n  max-height: 150px;\n}\n\n.page {\n  min-height: 100vh;\n  position: relative;\n}\n\n.page-padded-center {\n  width: 50%;\n  margin: 0 auto;\n  padding-bottom: 30px;\n}\n\n.page-centered-content {\n  color: #3e3e3e;\n  text-align: center;\n  width: 100%;\n  position: relative;\n  display: flex;\n  min-height: 100vh;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  margin: 0 auto;\n}\n\n.section {}\n.section-sub {\n  margin-left: 10px;\n  margin-top: 10px;\n}\n\n.header {\n  font-size: 23px;\n  font-weight: bold;\n  color: black;\n  text-decoration: none;\n  padding-top: 5px;\n  padding-bottom: 5px;\n  display: block;\n}\n\n.nav {\n  margin: 15px;\n  position: absolute;\n  z-index: 1000;\n  top: 0;\n  right: 0;\n}\n\n.nav > .button {\n  border-color: #fff;\n  color: #fff;\n}\n.nav > .button:hover {\n  border-color: #fff;\n  background-color: #fff;\n  color: #3e3e3e;\n}\n\n.button {\n  font-weight: 600;\n  display: inline-block;\n  padding: 8px 0;\n  width: 130px;\n  color: #3e3e3e;\n  border: 1px solid #3e3e3e;\n  border-radius: 5px;\n  text-decoration: none;\n  font-size: 20px;\n  transition: opacity 200ms;\n  text-align: center;\n  margin: 10px 5px;\n}\n\n.button-getting-started {\n  width: 160px;\n  margin-top: 15px;\n}\n\n.button:hover {\n  background: #3e3e3e;\n  color: #ededed;\n  border: 1px solid #3e3e3e;\n}\n\n.terminal {\n  border: 1px solid rgba(62, 62, 62, 0.56);\n  background-color: #3e3e3e;\n  color: #ededed;\n  border-radius: 5px;\n  padding: 10px;\n  overflow: scroll;\n}\n\n.terminal-install {\n  margin: 0 auto;\n  text-align: left;\n  width: 240px;\n  white-space: normal;\n  overflow: hidden;\n}\n\n.terminal code {\n  display: block;\n  font-size: 16px;\n  color: white;\n  font-weight: 300;\n}\n\ncode {\n  color: #d75e4e;\n  font-weight: bold;\n}\n\n.code-example {\n  border: 1px solid rgba(62, 62, 62, 0.30);\n  border-radius: 5px;\n  padding: 10px;\n  word-wrap: break-word;\n}\n\n.footer {\n  width: 100%;\n  border-top: 1px solid rgba(62, 62, 62, 0.30);\n  text-align: center;\n  margin-top: 20px;\n  padding-top: 10px;\n  padding-bottom: 10px;\n}\n\n.footer-link {\n  color: black;\n  font-weight: bold;\n  text-decoration: none;\n}\n\nb {\n  font-weight: bold;\n}\n\npre, pre * {\n  font-family: monospace;\n}\n\nblockquote {\n  margin: 0;\n  border-left: 3px solid #3e3e3e;\n  padding-left: 5px;\n  font-weight: 100;\n}\n\n@media only screen and (max-width: 800px) {\n  body {\n    margin-top: 75px;\n  }\n  .nav > .button {\n    width: 125px;\n    font-size: 14px;\n    display: inline-block;\n    margin: 5px;\n  }\n}\n</style>\n            <meta name="description" content="{{ site.description }}">\n        </head>\n\n\n        <body>\n          {{-- includes ${path.resolve(__dirname)}/fixtures/nav.sy --}}\n\n          <div class="top-rect"></div>\n          <div class="page">\n            <div class="page-centered-content">\n              {{ child }}\n            </div>\n\n            <div class="footer">\n              <div> created with ☕️ by <a class="footer-link" href="{{ site.user.github_url }}">{{ site.user.name }}</a> </div>\n            </div>\n          </div>\n        </body>\n\n      </html>`)

      t.end()
    })
  })
})
