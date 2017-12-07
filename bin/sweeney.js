#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const bootstrap = require('../lib/bootstrap');
const generate = require('../lib/generate');

const { getConfig } = require('../lib/util');

const args = process.argv.slice(2);

// this is used when establishing when a build occured
let build = Date.now();
let program = {};

args.forEach((a, i) => {
  switch(a) {
  case '-v':
  case '--version':
      console.log(`v${require('../package.json').version}`); // eslint-disable-line
      process.exit(0);
    break;
  case '-d':
  case '--directory':
    if(args[i + 1]) {
      program.directory = args[i + 1];
    }
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

  `);
    process.exit(0);
    break;
    case '-n':
    case '--new':
    case 'new':
      program.new = true;
      program.name = program.port = args[i + 1];
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
      const directory = path.resolve(process.cwd(), program.name);

      await bootstrap(directory);
      console.log(`application bootstrapped in ${directory}`); // eslint-disable-line
    } catch(ex) {
      console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
    }
  }());
}

if(program.build) {
  (async function() {
    try {
      const directory = path.resolve(process.cwd(), program.directory || './');
      const config = getConfig(directory);

      await generate(directory, config);
      console.log(`site built at ${path.resolve(process.cwd(), program.directory || './', config.output || 'site')}`); // eslint-disable-line
    } catch(ex) {
      console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
    }
  }());
}

if(program.serve) {
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
    const config = getConfig(directory);

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
}

if(program.watch) {
  const directory = path.resolve(process.cwd(), program.directory || './');
  let config = getConfig(directory);
  const output = path.resolve(config.output || 'site');

  console.log(`watching ${directory}`); // eslint-disable-line
  fs.watch(directory, {
    recursive: true
  }, async function(ev, file) {
    try {
      // refresh the require cache in the case config has updated
      if(file.indexOf('sweeney.js') > -1) {
        delete require.cache[require.resolve(path.resolve(directory, 'sweeney.js'))];
        config = require(path.resolve(directory, 'sweeney.js'));
      }

      if(file.indexOf('.sweenyrc') > -1) {
        delete require.cache[require.resolve(path.resolve(directory, '.sweenyrc'))];
        config = require(path.resolve(directory, '.sweenyrc'));
      }

      // we don't want to rebuild the output directory because this is expected to change
      if(file.substring(0, file.lastIndexOf('/')) !== output.substring(output.lastIndexOf('/') + 1, output.length) && file.indexOf('.git') === -1) {
        console.log(`rebuilding because of ${ev} of ${file}`); // eslint-disable-line
        await generate(directory, config);
        build = Date.now();
      }
    } catch(ex) {
      console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
    }
  });
}
