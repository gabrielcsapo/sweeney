module.exports.parse = function parse(content) {
  if (/^---\n/.test(content)) {
    var end = content.search(/\n---\n/);
    if (end != -1) {
      return {
        options: JSON.parse(content.slice(4, end + 1)) || {},
        content: content.slice(end + 5)
      };
    }
  }
  return {
    options: {},
    content: content
  };
};
