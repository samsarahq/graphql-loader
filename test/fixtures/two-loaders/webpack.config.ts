const loaderPath = require.resolve("../../../src/loader");

module.exports = {
  context: __dirname,
  entry: "./index.js",
  module: {
    rules: [
      {
        test: /\.a\.(graphql)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: loaderPath,
            options: {
              validate: true,
              schema: "./schema.a.json"
            },
          },
        ],
      },
      {
        test: /\.b\.(graphql)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: loaderPath,
            options: {
              validate: true,
              schema: "./schema.b.json"
            },
          },
        ],
      },
    ],
  },
};
