---
{
  "layout": "post",
  "title": "Welcome to Sweeney!",
  "date": "2017-11-20 12:58:29",
  "tags": ["sweeney", "example"]
}
---

You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run `sweeney serve --watch`, which launches a web server and auto-regenerates your site when a file is updated.

To add new posts, simply add a file in the `_posts` directory that follows the convention `YYYY-MM-DD-name-of-post.ext` and includes the necessary options block.

```
---
{
  "layout": "post",
  "title": "Welcome to Sweeney!",
  "date": "2017-11-20 12:58:29",
  "tags": ["sweeney", "example"]
}
---
```

Take a look at the source for this post to get an idea about how it works.

| before | after |
|--------|-------|
| `hard` | `easy`|

There is also an option to override defaults with a `sweeney.js` in the root directory.

```javascript
module.exports = {
  source: './',
  output: '../../docs',
  ... // anything extra added to this file will be accessible via templates
};
```

Check out the [Sweeney docs](https://github.com/gabrielcsapo/sweeney) for more info on how to get the most out of Sweeney. File all bugs/feature requests at [Sweeney’s GitHub repo](https://github.com/gabrielcsapo/sweeney).
