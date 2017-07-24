# GraphQL Loader for Webpack

[![npm Version](https://img.shields.io/npm/v/webpack-graphql-loader.svg)](https://www.npmjs.com/package/webpack-graphql-loader)
[![Build Status](https://api.travis-ci.org/stephen/graphql-loader.svg?branch=master)](https://travis-ci.org/stephen/graphql-loader)


## Installation

```bash
yarn add --dev webpack-graphql-loader # or npm install --save-dev webpack-graphql-loader
```

You will also need to install a copy of [`graphql`](https://www.npmjs.com/package/graphql), which is a peer dependency of this package.

```bash
yarn add --dev graphql # or npm install --dev graphql
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

Specifies whether or not the imported document should be a printed graphql string, or a graphql DocumentNode AST. The latter is useful for interop with [`graphql-tag`](https://github.com/apollographql/graphql-tag#webpack-preprocessing).

#### removeUnusedFragments _(boolean) (default=false)_

If `true`, the loader will remove unused fragments from the imported document. This may be useful if a query is importing fragments from a file, but does not use all fragments in that file. Also see [this issue](https://github.com/apollographql/graphql-tag/issues/102). See issue below

## Import statements in `.graphql` files

The loader supports importing `.graphql` files from other `.graphql` files using an `#import` statement. For example:

`query.graphql`:
```graphql
#import "./fragments.graphql"

query {
  ...a
}
```

`fragments.graphql`:
```graphql
#import "./fragments.graphql"

fragment a on A {}
```

In the above example, fragment `a` and `b` will be made available within `query.graphql`. Note that all fragments in the imported file should be used, or the `removeUnusedFragments` can be used.

