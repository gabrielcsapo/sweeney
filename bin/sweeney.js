#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const woof = require('woof');
const { promisify } = require('util');

const { version } = require('../package.json');

const Site = require('../lib/site');

const readFile = promisify(fs.readFile);

const mimes = require('../lib/mimes');
const { ms, getConfig, copyDirectory, renderSubDepends } = require('../lib/util');

process.on('unhandledRejection', (error) => {
  console.error(`Error: \n ${error.stack}`); // eslint-disable-line
});

// this is used when establishing when a build occured
let build = Date.now();

let program = woof(`
  Usage: sweeney [options]

  Commands:

    new                        Bootstrap a new project within the current working directory
    build                      Build and output static files to site directory
    serve                      Generates a http server to serve content from the site directory

  Options:

    -h, --help                 Displays this screen
    -v, --version              Display the current version of sweeney

    -p, --port [port]          Overrides the randomized port for serve
    -s, --source [path]     Overrides the default path which is the current working directory
    -o, --output [path]        Overrides the output path
    -w, --watch                Will watch the directory used to generate site and build when changes are made.
                               If this is used in tandem with serve, it will inject javascript to reload the page when changes were made.
`, {
  version,
  commands: {
    new: {},
    build: {},
    serve: {}
  },
  flags: {
    source: {
      type: 'string',
      validate: function(value) {
        const stats = fs.statSync(value);
        return !stats.isDirectory() ? `please provide a valid directory path. \n ${value} is not a valid path.` : true;// ensure that this is a directory
      }
    },
    output: {
      type: 'string',
      validate: function(value) {
        const stats = fs.statSync(value);
        return !stats.isDirectory() ? `please provide a valid directory path. \n ${value} is not a valid path.` : true;// ensure that this is a directory
      }
    },
    port: {
      type: 'integer',
      default: 5000
    },
    watch: {
      type: 'boolean',
      default: false
    }
  }
});

if(program['help'] || program['version']) {
  process.exit(0);
}

async function getConfigInDirectory() {
  let config = await getConfig(program.source ? path.resolve(process.cwd(), program.source) : process.cwd());

  config.source = program.source ? path.resolve(process.cwd(), program.source) : config.source ? path.resolve(process.cwd(), config.source) : process.cwd();
  config.output = program.output ? path.resolve(process.cwd(), program.output) : config.output ? path.resolve(process.cwd(), config.output) : path.resolve(process.cwd(), 'site');

  return config;
}

(async function() {
  try {
    if(program.new) {
      const start = process.hrtime();
      const directory = process.cwd();

      await copyDirectory(path.resolve(__dirname, 'example'), directory);
      const end = process.hrtime(start);

      console.log(`application bootstrapped in ${directory} [${ms(((end[0] * 1e9) + end[1]) / 1e6)}]`); // eslint-disable-line
    }

    let config = await getConfigInDirectory();

    if(program.build) {
      const start = process.hrtime();

      const site = new Site(config);
      await site.build();

      if(config.include) {
        config.include.forEach((i) => {
          copyDirectory(path.resolve(config.source, i), config.output + i.substr(i.lastIndexOf('/'), i.length));
        });
      }

      const end = process.hrtime(start);
      // replace the source path with nothing so that we don't get a bunch of duplicate strings
      process.stdout.write(`
        site built at ${config.output} [${ms(((end[0] * 1e9) + end[1]) / 1e6)}]

        ${site.rendered.map((top) => '\n' + renderSubDepends(top, 0).replace(new RegExp(config.source + '/', 'g'), '')).join('')}
      `.trim() + '\n\n');
    }

    if(program.serve) {
      const server = http.createServer(async (req, res) => {
        if(req.url === '/__api/update') {
          res.statusCode = 200;
          return res.end(build.toString());
        }
        let file = req.url || '/index.html';
        if(file === '/') file = '/index.html';
        let ext = file.substr(file.lastIndexOf('.') + 1, file.length);

        try {
          // removing the leading / from the file name
          let contents = (await readFile(path.resolve(config.output, file.substr(1, file.length)))).toString('utf8');
          // inject javascript into the page to refresh it in the case that a new build occurs
          if(ext == 'html' && program.watch !== undefined) {
            contents = contents.replace('</body>', `<script type="text/javascript">
              window.onload = function() {
                var build = "${build}";
                var d = document.createElement('div');
                d.innerHTML = '💈 you are currently developing this site, any changes will trigger a refresh';
                d.style.padding = '10px';
                d.style.textAlign = 'center';
                d.style.border = '1px solid #e8e8e8';
                d.style.background = '#fff';
                d.style.margin = '10px';
                d.style.position = 'absolute';
                d.style.bottom = 0;
                d.style.right = 0;
                document.body.prepend(d);

                setInterval(function() {
                  var xhttp = new XMLHttpRequest();
                  xhttp.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                      if (this.responseText !== build) {
                        location.reload();
                      }
                    }
                  };
                  xhttp.open("GET", "/__api/update", true);
                  xhttp.send();
                }, 500);
              }
            </script></body>`);
          }

          res.writeHead(200, {
            'Content-Type': mimes[ext]
          });
          res.end(contents);
        } catch(ex) {
          res.statusCode = 500;
          res.end();
        }
      }).listen(program.port, () => {
        process.stdout.write(`sweeney listening on http://localhost:${server.address().port}\n`);
      });
    }

    if(program.watch) {
      let start = process.hrtime();

      let site = new Site(config);
      await site.build();
      let end = process.hrtime(start);
      process.stdout.write(`site built at ${config.output} [${ms(((end[0] * 1e9) + end[1]) / 1e6)}] and watching ${config.source}\n`);

      fs.watch(config.source, {
        recursive: true
      }, async function(ev, file) {
        // refresh the require cache in the case config has updated
        if(file.indexOf('.sweeney') > -1) {
          delete require.cache[require.resolve(path.resolve(config.source, '.sweeney'))];
          config = await getConfigInDirectory();
          site = new Site(config);
          await site.build();
        }

        // we don't want to rebuild the output directory because this is expected to change
        if(file.substring(0, file.lastIndexOf('/')) !== config.output.substring(config.output.lastIndexOf('/') + 1, config.output.length) && file.indexOf('.git') === -1) {
          start = process.hrtime();
          await site.build();
          build = Date.now();
          end = process.hrtime(start);
          process.stdout.write(`
            site rebuilt in [${ms(((end[0] * 1e9) + end[1]) / 1e6)}] because of ${ev} of ${file}
            ${site.rendered.map((top) => '\n' + renderSubDepends(top, 0).replace(new RegExp(config.source + '/', 'g'), '')).join('')}
          `.trim() + '\n\n');
        }
      });
    }
  } catch(ex) {
    process.stdout.write(`Error: \n ${ex.stack} \n`);
  }
}());
