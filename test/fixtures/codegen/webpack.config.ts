const path = require("path");
const loaderPath = require.resolve("../../../src/loader");

module.exports = {
  context: __dirname,
  entry: "./entry.ts",
  module: {
    rules: [
      {
        test: /\.graphql$/,
        exclude: /node_modules/,
        use: [
          { loader: "ts-loader" },
          {
            loader: loaderPath,
            options: {
              validate: true,
              schema: "./schema.json",
              codegen: {
                typescript: {
                  passthroughCustomScalars: true,
                  customScalarsPrefix: "gql_",
                },
              },
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.graphql$/],
        },
      },
    ],
  },
};
