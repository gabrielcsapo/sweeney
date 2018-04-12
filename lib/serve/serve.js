const fs = require('fs')
const path = require('path')
const http = require('http')
const { promisify } = require('util')
const formidable = require('formidable')

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const mimes = require('../mimes')
const { ms, get, set, getEditable, escapeRegexValues, getConfig, templateToString } = require('../util')

module.exports = async function ({ port, watch, site }) {
  const styles = await readFile(path.resolve(__dirname, 'serve.css'))
  let build = new Date()

  site.onBuild = function () {
    build = new Date()
  }

  return new Promise(function (resolve, reject) {
    const server = http.createServer(async (req, res) => {
      // TODO: clean this up
      if (req.url === '/__api/update') {
        res.statusCode = 200
        return res.end(build.toString())
      }
      if (req.url === '/_api/update/config') {
        var form = new formidable.IncomingForm()
        return form.parse(req, async (error, fields, files) => {
          if (error) {
            res.statusCode = 500
            res.end(`<!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Sweeney</title>
              </head>
              <body>
                <div>
                  Something went wrong:

                  <pre>
                    ${error.stack}
                  </pre>
                </div>
              </body>
            </html>`)
          }

          // We don't have to trigger a rebuild, since we are watching it should rebuild itself
          Object.keys(fields).forEach(async (key) => {
            if (key === 'filePath' || key === 'parentFilePath') return

            // only set the top level data on the config itself, everything else should be in the files
            if (key.indexOf('options') === -1) {
              const configPath = path.resolve(site.source, '.sweeney')
              let rawConfig = await readFile(configPath, 'utf8')
              // we are only looking for the last value in the key string
              const finalKey = key.substring(key.lastIndexOf('.') + 1, key.length)
              const previousValue = escapeRegexValues(get(site.config, key))
              const reg = new RegExp(`(['|"]*)${finalKey}(['|"]*)\\s*:\\s*(['|"]*)${previousValue}(['|"]*)`)
              rawConfig = rawConfig.replace(reg, function (value, quote1, quote2, quote3, quote4) {
                return `${quote1}${finalKey}${quote2}:${quote3}${fields[key]}${quote4}`
              })
              await writeFile(configPath, rawConfig, 'utf8')

              delete require.cache[require.resolve(configPath)]

              site.config = await getConfig(site.source)
            } else {
              site.files.forEach(async (f) => {
                if (f.filePath === fields['parentFilePath']) {
                  set(f, key, fields[key])
                  const newContent = templateToString(f)
                  await writeFile(fields['parentFilePath'], newContent, 'utf8')
                }
              })
            }
          })

          res.writeHead(302, {
            'Location': req.headers['referer']
          })
          res.end()
        })
      }
      const file = (req.url === '/' ? '/index.html' : req.url) || '/index.html'
      const ext = file.substr(file.lastIndexOf('.') + 1, file.length)

      try {
        // removing the leading / from the file name
        const fullPath = path.resolve(site.output, file.substr(1, file.length))
        // if we have a rendered file for what is being requested, use the rendered file
        const parsedFileName = Object.keys(site.rendered).filter((name) => site.rendered[name].filePath === fullPath)[0]

        const parsedFile = parsedFileName ? site.rendered[parsedFileName] : null

        let contents = parsedFile ? parsedFile.rendered : await readFile(fullPath, 'utf8')
        // inject javascript into the page to refresh it in the case that a new build occurs
        if (ext === 'html' && watch !== undefined) {
          const editable = getEditable(parsedFile)

          contents = contents.replace('</body>', `<script type="text/javascript">
            function determineView() {
              const page = document.querySelector('.editable-body__page').style;

              if(location.hash === '#desktop') {
                page.width = '90%';
                page.border = 0;
              }
              if(location.hash === '#tablet') {
                page.width = '768px';
                page.borderLeft = '1px solid #dedede';
                page.borderRight = '1px solid #dedede';
              }
              if(location.hash === '#mobile') {
                page.width = '480px';
                page.borderLeft = '1px solid #dedede';
                page.borderRight = '1px solid #dedede';
              }
            }
            window.onhashchange = determineView;

            window.onload = function() {
              document.querySelector('body').style.overflowX = 'scroll';
              const oldContent = document.querySelector('body').innerHTML;
              document.querySelector('body').innerHTML = '';

              const defautStyle = document.createElement('style');
              defautStyle.type = 'text/css';
              defautStyle.appendChild(document.createTextNode(\`${styles}\`));
              document.head.appendChild(defautStyle);

              const editableSideBar = document.createElement('div');
              const outsideContainer = document.createElement('div');

              editableSideBar.className = 'editable-container';
              editableSideBar.innerHTML = \`<div>
                <small> ${ms(parsedFile.time)} </small>
                <br/>
                <br/>
                ${Object.keys(editable).map((template) => {
    return `<form method="post" action="/_api/update/config">
                    <div class="editable-container__item">
                      <h5 class="editable-container__item-header"><b>${template.replace(site.source, '')}</b></h5>
                      <ul class="editable-container__item-list">
                        ${Object.keys(editable[template]).map((variableName) => {
    return `
                            <li class="editable-container__item-list-item">
                              <label class="editable-container__item-list-item__label">${variableName}</label>
                              <input class="editable-container__item-list-item__input" type="text" placeholder="${variableName}" name="${variableName}" value="${editable[template][variableName].value}"/>
                            </li>
                          `
  }).join('')}
                      </ul>
                    </div>
                    <input name="filePath" value="${template}" style="visibility: hidden;height:0px;display: block;"/>
                    <input name="parentFilePath" value="${parsedFile.data.filePath}" style="visibility: hidden;height:0px;display: block;"/>
                    <button class="editable-container__save" type="submit">Update</button>
                  </form>`
  }).join('')}
                <div class="navigation-controls">
                  <a class="navigation-controls__item" href="#desktop">
                    <svg width="100%" height="100%" viewBox="0 0 44 40" version="1.1" aria-hidden="true"><path d="M40 0H4C1.79 0 0 1.79 0 4v24c0 2.21 1.79 4 4 4h14l-4 6v2h16v-2l-4-6h14c2.21 0 4-1.79 4-4V4c0-2.21-1.79-4-4-4zm0 24H4V4h36v20z"/></svg>
                  </a>
                  <a class="navigation-controls__item" href="#tablet">
                    <svg width="100%" height="100%" viewBox="0 0 38 48" version="1.1" aria-hidden="true"><path d="M33 0H5C2.24 0 0 2.24 0 5v38c0 2.76 2.24 5 5 5h28c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM19 46c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm15-8H4V6h30v32z"/></svg>
                  </a>
                  <a class="navigation-controls__item" href="#mobile">
                    <svg width="100%" height="100%" viewBox="0 0 26 44" version="1.1" aria-hidden="true"><path d="M21 0H5C2.24 0 0 2.24 0 5v34c0 2.76 2.24 5 5 5h16c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zm-8 42c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm9-8H4V6h18v28z"/></svg>
                  </a>
                </div>
              </div>
              \`;

              outsideContainer.innerHTML = \`<div class="editable-body">
                <div class="editable-body__sidebar">
                  \${editableSideBar.outerHTML}
                </div>

                <div class="editable-body__page">
                  \${oldContent}
                </div>
              </div>
              \`

              document.body.prepend(outsideContainer);

              determineView();

              var build = "${build}";
              var developmentToast = document.createElement('div');
              developmentToast.innerHTML = '💈 you are currently developing this site, any changes will trigger a refresh';
              developmentToast.style.padding = '10px';
              developmentToast.style.textAlign = 'center';
              developmentToast.style.border = '1px solid #e8e8e8';
              developmentToast.style.background = '#fff';
              developmentToast.style.margin = '10px';
              developmentToast.style.position = 'absolute';
              developmentToast.style.bottom = 0;
              developmentToast.style.right = 0;
              document.body.prepend(developmentToast);

              setInterval(function() {
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                  if (this.readyState === 4 && this.status === 200) {
                    if (this.responseText !== build) {
                      location.reload();
                    }
                  }
                };
                xhttp.open("GET", "/__api/update", true);
                xhttp.send();
              }, 500);
            }
          </script></body>`)
        }

        res.writeHead(200, {
          'Content-Type': mimes[ext]
        })
        res.end(contents)
      } catch (ex) {
        // TODO: make this more user friendly (find the issue and offer suggestions)
        res.writeHead(500, {
          'Content-Type': mimes['json']
        })
        res.end(JSON.stringify({
          error: ex.stack
        }))
      }
    })
    server.listen(port, (error) => error ? reject(error) : resolve(server))
  })
}
