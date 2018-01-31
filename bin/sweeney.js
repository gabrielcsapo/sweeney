#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const stat = promisify(fs.stat);

const Site = require('../lib/site');

const { ms, copyDirectory } = require('../lib/util');

const args = process.argv.slice(2);

process.on('unhandledRejection', (error) => {
  console.error(`something extremely wrong happened \n ${error.stack}`); // eslint-disable-line
});

// this is used when establishing when a build occured
let build = Date.now();
let program = {};

args.forEach(async function(a, i){
  switch(a) {
  case '-v':
  case '--version':
      console.log(`v${require('../package.json').version}`); // eslint-disable-line
      process.exit(0);
    break;
  case '-d':
  case '--directory':
    program.directory = path.resolve(args[i + 1]);
    try {
      const stats = await stat(program.directory);
      stats.isDirectory(); // ensure that this is a directory
    } catch(ex) {
      console.error(`please provide a valid directory path. \n ${program.directory} is not a valid path.`); // eslint-disable-line
      process.exit(1);
    }
    break;
  case '-o':
  case '--output':
    program.output = path.resolve(args[i + 1]);
  break;
  case '-p':
  case '--port':
    program.port = args[i + 1];
    break;
  case 'help':
  case '-h':
  case '--help':
    console.log(``+ // eslint-disable-line
  `
    Usage: sweeney [options]

    Commands:

      -n, --new, new [name]  bootstrap a new project with in the directory named
      -b, --build, build     build and output static files to site directory
      -s, --serve, serve     generates a http server to serve content from the site directory
      -h, --help, help       displays this screen
      -w, --watch, watch     will watch the directory used to generate site and build when changes are made. If this is used in tandem with serve, it will inject javascript to reload the page when changes were made.

    Options:

      -p, --port [port]          overrides the randomized port for serve
      -d, --directory [path]     overrides the default path which is the current working directory
      -o, --output [path]        overrides the output path
  `);
    process.exit(0);
    break;
    case '-n':
    case '--new':
    case 'new':
      program.new = true;
      program.name = args[i + 1];
      if(!program.name) {
        console.error('please provide a valid name. \n sweeney new [name]'); // eslint-disable-line
        process.exit(1);
      }
    break;
    case '-b':
    case '--build':
    case 'build':
      program.build = true;
    break;
    case '-s':
    case '--serve':
    case 'serve':
      program.serve = 'serve';
    break;
    case '-w':
    case '--watch':
    case 'watch':
      program.watch = 'watch';
    break;
  }
});

if(program.new) {
  (async function() {
    try {
      const start = process.hrtime();
      const directory = path.resolve(process.cwd(), program.name);

      await Site.bootstrap(directory);
      const end = process.hrtime(start);
      console.log(`application bootstrapped in ${directory} [${ms(((end[0] * 1e9) + end[1]) / 1e6)}]`); // eslint-disable-line
    } catch(ex) {
      console.log(`uhoh something happened \n ${ex}`); // eslint-disable-line
    }
  }());
}

if(program.build) {
  (async function() {
    try {
      const start = process.hrtime();
      const directory = program.directory || process.cwd();
      let config = await Site.getConfig(directory);

      // overrides the output
      program.output ? config.output = program.output : '';

      const site = new Site(directory, config);
      await site.generate();

      if(config.includes) {
        config.includes.forEach((i) => {
          let output = path.resolve(process.cwd(), config.output) + i.substr(i.lastIndexOf('/'), i.length);
          copyDirectory(path.resolve(directory, i), output);
        });
      }

      const end = process.hrtime(start);
      console.log(`site built at ${path.resolve(directory, config.output || 'site')} [${ms(((end[0] * 1e9) + end[1]) / 1e6)}]`); // eslint-disable-line
    } catch(ex) {
      console.log(`uhoh something happened \n ${ex}`); // eslint-disable-line
    }
  }());
}

if(program.serve) {
  (async function() {
    try {
      const extensions = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'png': 'image/png',
        'gif': 'image/gif',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'svg': 'image/svg+xml'
      };
      const directory = path.resolve(process.cwd(), program.directory || './');
      const config = await Site.getConfig(directory);

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
          let contents = fs.readFileSync(path.resolve(directory, (config.output || 'site'), file.substr(1, file.length)));
          // inject javascript into the page to refresh it in the case that a new build occurs
          if(ext == 'html' && program.watch !== undefined) {
            contents = contents.toString('utf8').replace('</body>', `<script>
              (function() {
                var build = "${build}";
                var d = document.createElement('div');
                d.innerHTML = '💈 you are currently developing this site, any changes will trigger a refresh';
                d.style.padding = '10px';
                d.style.textAlign = 'center';
                d.style.borderBottom = '1px solid #e8e8e8';
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
          res.writeHead(200, {
            'Content-Type': extensions[ext],
            'Content-Length' : contents.length
          });
          res.end(contents);
        } catch(ex) {
          res.statusCode = 500;
          res.end();
        }
      }).listen(program.port, () => {
        console.log(`sweeney listening on http://localhost:${server.address().port}`); // eslint-disable-line
      });
    } catch(ex) {
      console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
    }
  }());
}

if(program.watch) {
  (async function() {
    const directory = path.resolve(process.cwd(), program.directory || './');
    let config = await Site.getConfig(directory);
    const output = path.resolve(config.output || 'site');

    console.log(`watching ${directory}`); // eslint-disable-line
    fs.watch(directory, {
      recursive: true
    }, async function(ev, file) {
      try {
        // refresh the require cache in the case config has updated
        if(file.indexOf('.sweeney') > -1) {
          delete require.cache[require.resolve(path.resolve(directory, '.sweeney'))];
          config = require(path.resolve(directory, '.sweeney'));
        }

        // we don't want to rebuild the output directory because this is expected to change
        if(file.substring(0, file.lastIndexOf('/')) !== output.substring(output.lastIndexOf('/') + 1, output.length) && file.indexOf('.git') === -1) {
          console.log(`rebuilding because of ${ev} of ${file}`); // eslint-disable-line
          const site = new Site(directory, config);
          await site.generate();
          build = Date.now();
        }
      } catch(ex) {
        console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
      }
    });
  }());
}
