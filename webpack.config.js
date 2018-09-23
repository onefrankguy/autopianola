const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/autopianola.js',
  output: {
    filename: 'autopianola.js'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'autopianola.css'
    })
  ],
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader'
      ]
    }]
  }
};
