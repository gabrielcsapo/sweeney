# sweeney

> 💈 a blog aware, static site generator

[![Npm Version](https://img.shields.io/npm/v/sweeney.svg)](https://www.npmjs.com/package/sweeney)
[![Build Status](https://travis-ci.org/gabrielcsapo/sweeney.svg?branch=master)](https://travis-ci.org/gabrielcsapo/sweeney)
[![Coverage Status](https://lcov-server.gabrielcsapo.com/badge/github%2Ecom/gabrielcsapo/sweeney.svg)](https://lcov-server.gabrielcsapo.com/coverage/github%2Ecom/gabrielcsapo/sweeney)
[![Dependency Status](https://starbuck.gabrielcsapo.com/badge/github/gabrielcsapo/sweeney/status.svg)](https://starbuck.gabrielcsapo.com/github/gabrielcsapo/sweeney)
[![devDependency Status](https://starbuck.gabrielcsapo.com/badge/github/gabrielcsapo/sweeney/dev-status.svg)](https://starbuck.gabrielcsapo.com/github/gabrielcsapo/sweeney#info=devDependencies)
[![npm](https://img.shields.io/npm/dt/sweeney.svg)]()
[![npm](https://img.shields.io/npm/dm/sweeney.svg)]()

## Installation

```
npm install sweeney -g
```

## Usage

```
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
```
