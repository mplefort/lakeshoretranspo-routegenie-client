const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/commands/billingWorkflowInteractive.ts',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.csv$/,
        type: 'asset/resource',
        generator: {
          filename: 'mappings/[name][ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'billingWorkflowInteractive.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  externals: {
    // Mark these as external to avoid bundling them
    'readline': 'commonjs readline',
    'sqlite3': 'commonjs sqlite3',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'data',
          to: 'data',
          noErrorOnMissing: true,
        },
        {
          from: 'mappings',
          to: 'mappings',
          noErrorOnMissing: false,
        },
      ],
    }),
  ],
};
