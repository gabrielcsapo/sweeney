# 1.3.2 (05/23/2018)

- cleans up timing logic

# 1.3.1 (04/11/2018)

- fixes issue with `development-toast` being hidden behind page text
  - abstracts `development-toast` styles into serve.css
- makes sure that files that are not html are served as binary assets
  - fixes issue with `.woff` and other binary files not being read properly

# 1.3.0 (04/11/2018)

- css files can now be interpreted by the editable plugin when they change their extension to `sy` and set the type to `css`
- includes now outputs css styles with proper type tag (type='text/css')
- the editable plugin now allows type color to be passed
- the save action for form submission in serve is now actually async (it wasn't before, sometimes it would write sometimes it wouldn't)
- get and set now support mixed object access forms such as `obj.name` or `obj['name']` or `obj["name"]`

# 1.2.2 (04/11/2018)

- if you edit something using editable view, it will write the wrong template to disk (this is fixed)
  - makes sure that `templateToString` outputs the right content
    - exports `rawContent` on page when parsed which ensures plugins did not alter the content
- makes sure if the user had quotes on a variable in `.sweeney` that same quote / or not quote is persisted if updated.
  - this ensures if the value was a number it will be properly written
- `templateToString` does not write type unless it was in options

# 1.2.1 (04/11/2018)

- removes `makeSearchable` migrates to `get` instead
- moves `get`, `set` and `getEditable` to utils with tests

# 1.2.0 (04/10/2018)

- plugins don't have to have a parse or render method to be interpreted.
- makes sure content, type and collection is always returned even if no options block is parsed from string
- crawl will inject `outputPath` into all pages that are rendered
- inMemory is now an option on Site that doesn't build the site to disk but rather to memory
- `onBuild` can now be set on Site that will trigger after a build has been finished
- reduces the complexity of bin operations. All Site based functionality is done at the top level instead of each function having its own instance, it is shared.
- when the server fails it will throw the stack output not the error.toString() `this is not really helpful`
- moves linting to standard

# 1.1.0 (02/27/2018)

- fixes new command (the path to the example/new project directory was wrong)
- fixes and tests `copyDirectory` to ensure files and sub directories are copied before completed
- removes dead code getConfig
- removes getRenderedDepends method as it does nothing.
  - fixes and tests renderSubDepends to work with the default behavior of template linking
- removes includes business logic to new `plugins architecture`!
- parseString is now async, because plugins can parse async
- `ms` now truncates milliseconds to the 4th decimal place if displaying milliseconds only

# 1.0.2 (02/26/2018)

- makes sure if you change `.sweeney` during watch, it will rebuild and uncache the old config.
- outputs build metrics per file and its dependencies

# 1.0.1 (02/26/2018)

- ensures serve inputs watch script is injected into html file.
- does not set content-length on buffered content

# 1.0.0 (02/16/2018) [BREAKING CHANGE]

- fixes watch to acknowledge the source attribute in the config file
- adds a complete set of mime types
- consolidates the source and output logic by renaming references that were generically named directory to either source or output
- the only files that are parsed are files with the extension `.sy`
- there are no predetermined collection types, those are defined in the options block in the file
- exposes render function to config file that lets user override render method for certain files
- revamps example website to be less complicated and more in touch with the rest of the site design

# 0.2.0 (01/30/2018)

- config is named `.sweeney` no other variants
- propagate errors in `.sweeney` to user, don't suppress them.

# 0.1.1 (12/10/2017)

- fixes config file from being named `.sweenyrc` to `.sweeneyrc`
- posts will expose post.* on the template page, pages will expose page.* which will reflect the options block
- fixes the generation of output path

# 0.1.0 (12/10/2017)

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
