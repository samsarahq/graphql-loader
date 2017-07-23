const loaderPath = require.resolve("../../../src/loader");

module.exports = {
  context: __dirname,
  entry: "./query.graphql",
  module: {
    rules: [
      {
        test: /\.(graphql)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: loaderPath,
            options: { validate: true },
          },
        ],
      },
    ],
  },
};
