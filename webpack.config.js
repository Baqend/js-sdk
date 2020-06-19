const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const tsOptions = {
  es5: {
    target: "es5",
    module: "commonjs",
  },
  es2015: {
    target: "es6",
    module: "es2015",
  }
}

module.exports = env => {
  return {
    mode: 'production',
    entry: {
      [`baqend.${env.target}`]: './lib/index.ts',
      [`baqend.${env.target}.min`]: './lib/index.ts',
      [`baqend-realtime.${env.target}`]: './realtime/index.ts',
      [`baqend-realtime.${env.target}.min`]: './realtime/index.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist/bundles/'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'DB',
        umdNamedDefine: true
    },
    externals: {
      rxjs: 'rxjs'
    },
    resolve: {
      extensions: ['.ts', '.js'],
        aliasFields: ['browser']
    },
    devtool: 'source-map',
      node: false,
    optimization: {
    minimize: true,
      minimizer: [
      new TerserPlugin({
        include: /\.min\.js$/,
      }),
    ],
  },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: [/node_modules/],
          loader: 'ts-loader',
          options: {
            compilerOptions: tsOptions[env.target]
          },
        },
      ],
    },
  }
};