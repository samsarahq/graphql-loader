import gql from "graphql-tag";

export default function(source) {
  return "module.exports = " + JSON.stringify(gql(source));
}
