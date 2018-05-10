# GraphQL Loader for Webpack

[![npm Version](https://img.shields.io/npm/v/webpack-graphql-loader.svg)](https://www.npmjs.com/package/webpack-graphql-loader)
[![Build Status](https://api.travis-ci.org/samsarahq/graphql-loader.svg?branch=master)](https://travis-ci.org/samsarahq/graphql-loader)

A webpack loader for `.graphql` query documents with first class support for **schema validation** and **fragments definitions**. `graphql-loader` works great with [thunder](https://github.com/samsarahq/thunder), [apollo-client](#output-string--document-defaultstring), and anywhere you might want to provide a GraphQL query document in the frontend.

## Installation

```bash
yarn add --dev webpack-graphql-loader # or npm install --save-dev webpack-graphql-loader
```

You will also need to install a copy of [`graphql`](https://www.npmjs.com/package/graphql), which is a peer dependency of this package.

```bash
yarn add --dev graphql # or npm install --save-dev graphql
```


## Configuration

Add `webpack-graphql-loader` to your webpack configuration:
```javascript
module.exports = {
  // ...
  module: {
    rules: [ // or "loaders" for webpack 1.x
      { test: /\.graphql?$/, loader: 'webpack-graphql-loader' }
    ]
  }
}
```

### Specifying options
You can also pass options to the loader via webpack options:
```javascript
module.exports = {
  // ...
  module: {
    rules: [ // or "loaders" for webpack 1.x
      {
        test: /\.graphql?$/,
        use: [
          {
            loader: 'webpack-graphql-loader',
            options: {
              // validate: true,
              // schema: "./path/to/schema.json",
              // removeUnusedFragments: true
              // etc. See "Loader Options" below
            }
          }
        ]
      }
    ]
  }
}
```

### Loader Options

#### schema _(string) (default="")_

The location of your graphql introspection query schema JSON file. If used with the `validate` option, this will be used to validate imported queries and fragments.

#### validate _(boolean) (default=false)_

If `true`, the loader will validate the imported document against your specified `schema` file.

#### output _("string" | "document") (default="string")_

Specifies whether or not the imported document should be a printed graphql string, or a graphql `DocumentNode` AST. The latter is useful for interop with [`graphql-tag`](https://github.com/apollographql/graphql-tag#webpack-preprocessing).

#### minify _(boolean) (default=false)_

If `true` and the `output` option is `string`, the loader will strip comments and whitespace from the graphql document strings.  This helps to reduce bundled code size.

#### removeUnusedFragments _(boolean) (default=false)_

If `true`, the loader will remove unused fragments from the imported document. This may be useful if a query is importing fragments from a file, but does not use all fragments in that file. Also see [this issue](https://github.com/apollographql/graphql-tag/issues/102).

## Import statements in `.graphql` files

The loader supports importing `.graphql` files from other `.graphql` files using an `#import` statement. For example:

`query.graphql`:
```graphql
#import "./fragments.graphql"

query {
  ...a
  ...b
}
```

`fragments.graphql`:
```graphql
fragment a on A {}
fragment b on A {
  foo(bar: 1)
}
```

In the above example, fragments `a` and `b` will be made available within `query.graphql`. Note that all fragments in the imported file should be used in the top-level query, or the `removeUnusedFragments` should be specified.

