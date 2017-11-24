#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const qs = require('qs');

const bootstrap = require('../lib/bootstrap');
const generate = require('../lib/generate');

const args = process.argv.slice(2);

// this is used when establishing when a build occured
let build = Date.now();
const options = {};
args.filter((a) => a.indexOf('--') > -1).forEach((a) => Object.assign(options, qs.parse(a)));

switch(args[0]) {
  case 'help':
    console.log(``+ // eslint-disable-line
    `
      Usage: sweeney [options]

      Commands:

        new [name]  bootstrap a new project with in the directory named
        build       build and output static files to site directory
        serve       generates a http server to serve content from the site directory
        help        displays this screen

      Options:

        --port={Number}     overrides the randomized port for serve
        --directory={Path}  overrides the default path which is the current working directory
        --watch             will watch the directory used to generate site and build when changes are made. If this is used in tandem with serve, it will inject javascript to reload the page when changes were made.

    `);
  break;
  case 'new':
    (async function() {
      try {
        const name = args[1];
        const directory = path.resolve(process.cwd(), name);

        await bootstrap(directory);
        console.log(`application bootstrapped in ${directory}`); // eslint-disable-line
      } catch(ex) {
        console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
      }
    }());
  break;
  case 'build':
    (async function() {
      try {
        const directory = path.resolve(process.cwd(), options['--directory'] || './');
        const config = require(path.resolve(directory, 'sweeney.js'));

        await generate(directory, config);
        console.log(`site built at ${path.resolve(process.cwd(), options['--directory'] || './', config.output || 'site')}`); // eslint-disable-line
      } catch(ex) {
        console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
      }
    }());
  break;
  case 'serve':
    try {
      const directory = path.resolve(process.cwd(), options['--directory'] || './');
      const config = require(path.resolve(directory, 'sweeney.js'));

      const server = http.createServer((req, res) => {
        if(req.url === '/__api/update') {
          res.statusCode = 200;
          return res.end(build.toString());
        }
        let file = req.url || '/index.html';
        if(file === '/') file = '/index.html';
        let ext = file.substr(file.lastIndexOf('.') + 1, file.length);

        try {
          // removing the leading / from the file name
          let contents = fs.readFileSync(path.resolve(directory, (config.output || 'site'), file.substr(1, file.length))).toString('utf8');
          // inject javascript into the page to refresh it in the case that a new build occurs
          if(ext == 'html' && options['--watch'] !== undefined) {
            contents = contents.replace('</body>', `<script>
              (function() {
                var build = "${build}";
                var d = document.createElement('div');
                d.innerHTML = '💈 you are currently developing this site, any changes will trigger a refresh';
                d.style.padding = '10px';
                d.style.textAlign = 'center';
                document.body.prepend(d);

                setInterval(function() {
                  var xhttp = new XMLHttpRequest();
                  xhttp.onreadystatechange = function() {
                      if (this.readyState == 4 && this.status == 200) {
                        if(this.responseText !== build) {
                          location.reload();
                        }
                      }
                  };
                  xhttp.open("GET", "/__api/update", true);
                  xhttp.send();
                }, 500)
              }());
            </script></body>`);
          }
          res.end(contents);
        } catch(ex) {
          res.statusCode = 500;
          res.end();
        }
      }).listen(options['--port'], () => {
        console.log(`sweeney listening on http://localhost:${server.address().port}`); // eslint-disable-line
      });
    } catch(ex) {
      console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
    }
  break;
  default:
    console.log(`sorry the command ${args[0]} is not supported`); // eslint-disable-line
  break;
}

if(options['--watch'] !== undefined) {
  const directory = path.resolve(process.cwd(), options['--directory'] || './');
  let config = require(path.resolve(directory, 'sweeney.js'));

  console.log(`watching ${path.resolve(process.cwd(), options['--directory'] || './')}`); // eslint-disable-line
  fs.watch(directory, {
    recursive: true
  }, async function(ev, file) {
    // refresh the require cache in the case config has updated
    if(file.indexOf('sweeney.js') > -1) {
      delete require.cache[require.resolve(path.resolve(directory, 'sweeney.js'))];
      config = require(path.resolve(directory, 'sweeney.js'));
    }
    // we don't want to rebuild the output directory because this is expected to change
    if(path.dirname(file).indexOf((config.output || 'site')) === -1) {
      console.log(`rebuilding because of ${ev} of ${file}`); // eslint-disable-line
      await generate(directory, config);
      build = Date.now();
    }
  });
}
