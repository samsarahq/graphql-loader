const gql = require("graphql-tag");

module.exports = function(source) {
  return "module.exports = " + JSON.stringify(gql(source));
};
