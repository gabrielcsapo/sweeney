const test = require('tape');

const Markdown = require('../lib/markdown');

test('markdown', (t) => {
  t.plan(2);

  t.test('@parse', (t) => {
    //t.test('should be able to parse known markdown elements', (t) => {
    //       let ast = Markdown.parse(`
    // # h1 Heading
    // ## h2 Heading
    // ### h3 Heading
    // #### h4 Heading
    // ##### h5 Heading
    // ###### h6 Heading
    //
    // ___
    // ---
    // ***
    //
    // **rendered as bold text**
    // _rendered as italicized text_
    // ~~Strike through this text.~~
    //
    // > blockquotes!!
    //
    // > Donec massa lacus, ultricies a ullamcorper in, fermentum sed augue.
    // Nunc augue augue, aliquam non hendrerit ac, commodo vel nisi.
    // >> Sed adipiscing elit vitae augue consectetur a gravida nunc vehicula. Donec auctor
    // odio non est accumsan facilisis. Aliquam id turpis in dolor tincidunt mollis ac eu diam.
    // >>> Donec massa lacus, ultricies a ullamcorper in, fermentum sed augue.
    // Nunc augue augue, aliquam non hendrerit ac, commodo vel nisi.
    //
    // * valid bullet
    // - valid bullet
    // + valid bullet
    //
    // 1. Lorem ipsum dolor sit amet
    // 2. Consectetur adipiscing elit
    // 3. Integer molestie lorem at massa
    // 4. Facilisis in pretium nisl aliquet
    // 5. Nulla volutpat aliquam velit
    // 6. Faucibus porta lacus fringilla vel
    // 7. Aenean sit amet erat nunc
    // 8. Eget porttitor lorem
    //
    // \`\`\` html
    // Sample text here...
    // \`\`\`
    //
    // | Option | Description |
    // | ------ | ----------- |
    // | data   | path to data files to supply the data that will be passed into templates. |
    // | engine | engine to be used for processing templates. Handlebars is the default. |
    // | ext    | extension to be used for dest files. |
    //
    // [sweeney](http://github.com/gabrielcsapo/sweeney)
    // [sweeney](http://github.com/gabrielcsapo/sweeney "Visit Sweeney")
    //
    // ![Minion](http://octodex.github.com/images/minion.png)
    // ![Alt text](http://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")
    //
    // ![Alt text][id]
    // [id]: http://octodex.github.com/images/dojocat.jpg  "The Dojocat"
    // `);
    //       // console.log(JSON.stringify(ast, null, 4));
    //       t.end();
    //     });
    t.test('should be able to parse table', (t) => {
      let ast = Markdown.parse(`
| Tables        | Are           | Cool  |
|:-------------:|:-------------:|:-----:|
| col 3 is      |    r-l        | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |
`);
      t.equal(ast[0].body[1].type, 'table');
      t.end();
    });
    t.test('should be able parse image', (t) => {
      let ast = Markdown.parse('![helloworld](./this/is/a/path.png)');

      t.equal(ast[0].type, 'markdown');
      t.equal(ast[0].body[0].type, 'paragraph');
      t.equal(ast[0].body[0].body[0].type, 'image');
      t.equal(ast[0].body[0].body[0].alt, 'helloworld');
      t.equal(ast[0].body[0].body[0].href, './this/is/a/path.png');

      t.end();
    });

    t.test('should be able parse link', (t) => {
      let ast = Markdown.parse('[helloworld](http://www.helloworld.com)');

      t.equal(ast[0].type, 'markdown');
      t.equal(ast[0].body[0].type, 'paragraph');
      t.equal(ast[0].body[0].body[0].type, 'link');
      t.equal(ast[0].body[0].body[0].content, 'helloworld');
      t.equal(ast[0].body[0].body[0].href, 'http://www.helloworld.com');

      t.end();
    });

    t.test('should be able parse inlineCode', (t) => {
      let ast = Markdown.parse('this is `sweeney`');

      t.equal(ast[0].type, 'markdown');
      t.equal(ast[0].body[0].body[1].type, 'inlineCode');
      t.equal(ast[0].body[0].body[1].content, 'sweeney');

      t.end();
    });

    t.test('should be able parse task list', (t) => {
      let ast = Markdown.parse(`
- [ ] buy groceries
* [ ] use groceries
`);

      t.equal(ast[0].type, 'markdown');
      t.equal(ast[0].body[0].type, 'newline');
      t.equal(ast[0].body[0].content, '\n');
      t.equal(ast[0].body[1].type, 'listblock');
      t.equal(ast[0].body[1].body.length, 2);
      t.equal(ast[0].body[1].body[0].type, 'list');
      t.equal(ast[0].body[1].body[0].content, '[ ] buy groceries');
      t.equal(ast[0].body[1].body[1].type, 'list');
      t.equal(ast[0].body[1].body[1].content, '[ ] use groceries');

      t.end();
    });

  });

  t.test('@toHTML', (t) => {
    t.test('should be generate table', (t) => {
      const html = Markdown.toHTML([{
        type: 'table',
        header: ['Tables', 'Are', 'Cool'],
        align: ['center', 'center', 'center'],
        cells: [
          ['col 3 is', 'r-l', '$1600'],
          ['col 2 is', 'centered', '$12'],
          ['zebra stripes', 'are neat', '$1']
        ]
      }]);
      t.equal(html.replace(/\n/g, '').replace(/ /g, ''), '<table><tr><th>Tables</th><th>Are</th><th>Cool</th><tr><tr><td>col3is</td><td>r-l</td><td>$1600</td></tr><tr><td>col2is</td><td>centered</td><td>$12</td></tr><tr><td>zebrastripes</td><td>areneat</td><td>$1</td></tr></table>');
      t.end();
    });
  });

});
