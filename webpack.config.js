const path = require('path');

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
  },
};
