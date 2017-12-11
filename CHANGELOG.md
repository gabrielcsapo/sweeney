# 0.1.0 (12/07/2017)

- enforces name when running `sweeney new`
- makes bootstrap async
  - went from ~4.28339ms to ~2.089147ms
- makes sure template site builds to ./site instead of ../../docs
- makes getTemplateFiles, getConfig, renderTemplates async
  - went from ~18ms to ~12ms
- only parses with Markdown parser if file is MD
  - allows for md files to exist at the root level
- all files now have a default date attribute which comes from stat.birthtime
- ensure directory cli input is valid
- adds an output option `-o, --output [path]`
- condenses a lot of static methods into class definitions
- config can now be a promise or function as well as javascript object

# 0.0.7 (12/07/2017)

- supports config files named `sweeney.js` or `.sweeneyrc`

# 0.0.6 (12/06/2017)

- updates the default template
- fixes lint errors

# 0.0.5 (12/06/2017)

- attributes can now be passed to include and be transformed into html attributes
- removes enforcement of posts directory
- fixes watch to not watch output directory or anything related to .git
- serve can now serve image assets
- alters template engine to be more reliable

# 0.0.4 (12/04/2017)

- fixes watch option to work correctly with serve
- fixes bug if `sweeney.js` file does not exist program will crash
- uses markdown-it package instead of rolling one

# 0.0.3 (12/01/2017)

- greatly improves the command line options and utility
- removes qs

# 0.0.2 (11/21/2017)

- adds `serve` command that starts up an http server and serves content from the site directory
- adds `--watch` option that will start a watch process that will build on any changes to the site, excluding the `site` directory
  - if `--watch` is used in tandem with `serve` javascript will executed in the body to refresh the page in case of any builds happen
- adds `--port` option that allows the serve command to use a specified port, by default this is random
- adds a `help` command
- if `config.output` is set, generate will favor that instead of the default which is `{site}/site`
- if `config.output` is set `serve` will use that instead of the default which is `{site}/site`
if `config.output` is set when built the console output will reflect the built directory
- parses code blocks correctly
- adds a `new` command to bootstrap basic template in the cwd

# 0.0.1 (11/21/2017)

- adds `build` command can be run as `build` or `build --directory=./some/directory`
- adds markdown parsing for `inlineCode`
- ensures inner table elements are parsed correctly (if inner table elements contain nested markdown)
- adds slug attribute to post object (this is the name of the html file to be referenced when linking)
- has the ability to generate posts and root level templates

# 0.0.0 (11/17/2017)

- idea started
