// createParser and createBodyParser creates parsers. A parser takes a string,
// and if successful returns an array of two elements. The object representation
// of consumed portion and the remainder of of the string. If failure returns null.

class Markdown {
  constructor(src) {
    this.src = src;
    this.ast = {};
  }
  // createParser takes a parser type, and regex pattern and
  // returns the corresponding parser function. The first match
  // in parenthesis is taken as the content. If this parser does not
  // suit your requirement write your own parser.

  createParser(type, pattern, match) {
    return function(src) {
      var found = src.match(pattern);
      if (found) {
        return match ? match(src, pattern, found) : [{
          type: type,
          content: found[1]
        }, src.replace(pattern, '')];
      } else {
        return null;
      }
    };
  }
  // createBodyParser takes as its first argument the "type" of the parser. The rest of the
  // arguments are the parsers that make up the bodyParser
  createBodyParser() {
    var parsers = Array.prototype.slice.call(arguments);
    var ast = {
      type: parsers.shift(),
      body: []
    };

    return function bodyParser(src) {
      for (var i = 0; i < parsers.length; i++) {
        var parser = parsers[i];
        var test = parser(src);
        if (test) {
          ast.body.push(test[0]);
          return bodyParser(test[1]);
        }
      }
      if (ast.body.length === 0) {
        return null;
      } else {
        var ret = [ast, src];
        ast = {
          type: ast.type,
          body: []
        };
        return ret;
      }
    };
  }
  attributesToHTML(attributes) {
    return Object.keys(attributes).filter((a) => {
      return ['content'].indexOf(a) === -1;
    }).map((a) => {
      return `${a}="${attributes[a]}"`;
    }).join(' ');
  }
  toHTML(ast) {
    var html = '';

    ast.forEach((a) => {
      switch(a.type) {
        case 'markdown':
          html += this.toHTML(a.body);
        break;
        case 'table':
          html += `<table>
            ${a.header ? `<tr>
              ${a.header.map((h) => `<th>${h}</th>`).join('')}
            <tr>` : ''}
            ${a.cells ?
              a.cells.map((row) => {
                return `<tr>
                  ${row.map((c) => `<td>${c}</td>`).join('')}
                </tr>`;
              }).join('')
            : ''}
          </table>`;
        break;
        case 'newline':
          html += a.content.replace(/\n/g, '<br/>');
        break;
        case 'paragraph':
          html += `<p>
            ${this.toHTML(a.body)}
          </p>`;
        break;
        case 'inlinetext':
          html += a.content;
        break;
        case 'link':
          html += `<a ${this.attributesToHTML(a)}>${a.content}</a>`;
        break;
      }
    });

    return html;
  }
  parse(src) {
    let { createParser, createBodyParser } = this;

    return createBodyParser('markdown',
      function options(src) {
        var pattern = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?/;
        var found = pattern.exec(src);
        if (found[2]) {
          return [{
            type: 'options',
            content: JSON.parse(found[2])
          }, src.replace(pattern, '')];
        } else {
          return null;
        }
      },
      createParser('newline', /^(\n+)/),
      createParser('h1', /^# ([^\n]+)/),
      createParser('h2', /^## ([^\n]+)/),
      createParser('h3', /^### ([^\n]+)/),
      createParser('h4', /^#### ([^\n]+)/),
      createParser('h5', /^##### ([^\n]+)/),
      createParser('h6', /^###### ([^\n]+)/),
      createParser('table', /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/, (src, pattern, match) => {
          const TABLE_HEADER_TRIM = /^ *| *\| *$/g;
          const TABLE_ALIGN_TRIM = /^ *|\| *$/g;
          const TABLE_CELLS_TRIM = /(?: *\| *)?\n$/;
          const PLAIN_TABLE_ROW_TRIM = /^ *\| *| *\| *$/g;
          const TABLE_ROW_SPLIT = / *\| */;
          const TABLE_RIGHT_ALIGN = /^ *-+: *$/;
          const TABLE_CENTER_ALIGN = /^ *:-+: *$/;
          const TABLE_LEFT_ALIGN = /^ *:-+ *$/;

          function parseTableAlignCapture(alignCapture) {
              if (TABLE_RIGHT_ALIGN.test(alignCapture)) return 'right';
              if (TABLE_CENTER_ALIGN.test(alignCapture)) return 'center';
              if (TABLE_LEFT_ALIGN.test(alignCapture)) return 'left';
              return null;
          }

          function parseTableHeader(capture) {
              return capture[1].replace(TABLE_HEADER_TRIM, '').split(TABLE_ROW_SPLIT);
          }

          function parseTableAlign(capture) {
              var alignText = capture[2].replace(TABLE_ALIGN_TRIM, '').split(TABLE_ROW_SPLIT);

              return alignText.map(parseTableAlignCapture);
          }

          function parseTableCells(capture) {
              var rowsText = capture[3].replace(TABLE_CELLS_TRIM, '').split('\n');

              return rowsText.map((rowText) => {
                  return rowText.replace(PLAIN_TABLE_ROW_TRIM, '').split(TABLE_ROW_SPLIT);
              });
          }

          const header = parseTableHeader(match);
          const align = parseTableAlign(match);
          const cells = parseTableCells(match);

          return [{ type: 'table', header, align, cells }, src.replace(pattern, '')];
      }),
      createParser('blockquote', /^> ([^\n]+)/),
      createBodyParser('codeblock',
        createParser('code', /^ {4}([^\n]+)\n/)
      ),
      createBodyParser('listblock',
        createParser('list', /^\* ([^\n]+)\n/),
        createParser('list', /^- ([^\n]+)\n/)
      ),
      createBodyParser('orderedListblock',
        createParser('orderedList', /^[0-9]+ ([^\n]+)\n/)
      ),
      createBodyParser('paragraph',
        createParser('inlinetext', /^([^\n[!*]+)/),
        createParser('link', /^\[(.+?)\]\((.+?)\)/, (src, pattern, match) => [{ type: 'link', content: match[1], href: match[2] }, src.replace(pattern, '')]),
        createParser('image', /^!\[(.+?)\]\((.+?)\)/, (src, pattern, match) => [{ type: 'image', alt: match[1], href: match[2] }, src.replace(pattern, '')]),
        createParser('emphasis', /^\*(.+?)\*/),
        createParser('strong', /^\*\*(.+?)\*\*/),
        createParser('text', /^([^\n]+)/)
      )
    )(src);
  }
}

module.exports = new Markdown();
