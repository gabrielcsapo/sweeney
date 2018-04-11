#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const woof = require('woof')

const { version } = require('../package.json')

const Site = require('../lib/site')
const Serve = require('../lib/serve/serve')

const { ms, getConfig, copyDirectory, renderSubDepends } = require('../lib/util')

process.on('unhandledRejection', (error) => {
  console.error(`Error: \n ${error.stack}`); // eslint-disable-line
})

const program = woof(`
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
      validate: function (value) {
        const stats = fs.statSync(value)
        return !stats.isDirectory() ? `please provide a valid directory path. \n ${value} is not a valid path.` : true// ensure that this is a directory
      }
    },
    output: {
      type: 'string',
      validate: function (value) {
        const stats = fs.statSync(value)
        return !stats.isDirectory() ? `please provide a valid directory path. \n ${value} is not a valid path.` : true// ensure that this is a directory
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
})

if (program['help'] || program['version']) {
  process.exit(0)
}

async function getConfigInDirectory () {
  const config = await getConfig(program.source ? path.resolve(process.cwd(), program.source) : process.cwd())

  config.source = program.source ? path.resolve(process.cwd(), program.source) : config.source ? path.resolve(process.cwd(), config.source) : process.cwd()
  config.output = program.output ? path.resolve(process.cwd(), program.output) : config.output ? path.resolve(process.cwd(), config.output) : path.resolve(process.cwd(), 'site')

  return config
}

(async function () {
  try {
    if (program.new) {
      const start = process.hrtime()
      const directory = process.cwd()

      await copyDirectory(path.resolve(__dirname, '..', 'example'), directory)
      const end = process.hrtime(start)

      process.stdout.write(`application bootstrapped in ${directory} [${ms(((end[0] * 1e9) + end[1]) / 1e6)}]`)
      process.exit(1)
    }

    let config = await getConfigInDirectory()
    // Only build to the virtual file system when we are serving content
    // Don't enable if build and serve and done together
    config.inMemory = program.watch && !program.build

    const site = new Site(config)

    if (program.build) {
      const start = process.hrtime()

      await site.build()

      if (config.include) {
        config.include.forEach((i) => {
          copyDirectory(path.resolve(config.source, i), config.output + i.substr(i.lastIndexOf('/'), i.length))
        })
      }

      const end = process.hrtime(start)

      // replace the source path with nothing so that we don't get a bunch of duplicate strings
      process.stdout.write(`
        site built at ${config.output} [${ms(((end[0] * 1e9) + end[1]) / 1e6)}]
        ${site.rendered.map((top) => '\n' + renderSubDepends(top, 0).replace(new RegExp(config.source + '/', 'g'), '')).join('')}
      `.trim() + '\n\n')
    }

    if (program.serve) {
      try {
        await site.build()

        let server = await Serve({
          port: program.port,
          watch: program.watch,
          site
        })

        process.stdout.write(`sweeney listening on http://localhost:${server.address().port}\n`)
        process.stdout.write('\u001B[90mremember to issue build after you done making changes to write to disk\u001B[39m\n')
      } catch (ex) {
        process.stdout.write(`server failed to start with error: \n ${ex.stack} \n`)
      }
    }

    if (program.watch) {
      process.stdout.write(`sweeney watching ${site.source} \n`)

      fs.watch(site.source, {
        recursive: true
      }, async function (ev, file) {
        // refresh the require cache in the case config has updated
        if (file.indexOf('.sweeney') > -1) {
          delete require.cache[require.resolve(path.resolve(site.source, '.sweeney'))]
          site.config = await getConfigInDirectory()
          await site.build()
        }

        // we don't want to rebuild the output directory because this is expected to change
        if (file.substring(0, file.lastIndexOf('/')) !== site.output.substring(site.output.lastIndexOf('/') + 1, site.output.length) && file.indexOf('.git') === -1) {
          const start = process.hrtime()

          await site.build()

          const end = process.hrtime(start)

          process.stdout.write(`
            site rebuilt in [${ms(((end[0] * 1e9) + end[1]) / 1e6)}] because of ${ev} of ${file}
            ${site.rendered.map((top) => '\n' + renderSubDepends(top, 0).replace(new RegExp(config.source + '/', 'g'), '')).join('')}
          `.trim() + '\n\n')
        }
      })
    }
  } catch (ex) {
    process.stdout.write(`Error: \n ${ex.stack} \n`)
  }
}())
