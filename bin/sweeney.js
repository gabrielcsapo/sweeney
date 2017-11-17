#!/usr/bin/env node

const args = process.argv.slice(2);

switch(args[0]) {
  case 'build':
    console.log('not implemented :('); // eslint-disable-line
  break;
  default:
    console.log(`sorry the command ${args[0]} is not supported`); // eslint-disable-line
  break;
}
