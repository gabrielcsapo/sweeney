#!/usr/bin/env node
const path = require('path');
const qs = require('qs');

const generate = require('../lib/generate');

const args = process.argv.slice(2);

const options = {};
args.filter((a) => a.indexOf('--') > -1).forEach((a) => Object.assign(options, qs.parse(a)));

switch(args[0]) {
  case 'build':
    (async function() {
      try {
        const directory = path.resolve(process.cwd(), options['--directory'] || './');
        const config = require(path.resolve(directory, 'sweeney.js'));

        await generate(directory, config);
        console.log(`site built at ${path.resolve(process.cwd(), options['--directory'] || './')}`); // eslint-disable-line
      } catch(ex) {
        console.log(`uhoh something happened \n ${ex.toString()}`); // eslint-disable-line
      }
    }());
  break;
  case 'serve':
    
  break;
  default:
    console.log(`sorry the command ${args[0]} is not supported`); // eslint-disable-line
  break;
}
