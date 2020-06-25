const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const EsmWebpackPlugin = require("@purtuga/esm-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fs = require('fs');

let dirCont = fs.readdirSync( "./spec" );
let testScripts = dirCont.filter(elm => elm.endsWith('.spec.js'));

const tsOptions = {
  es5: {
    target: "es5",
    module: "commonjs",
    importHelpers: true,
  },
  es2015: {
    target: "es6",
    module: "es2015",
  }
}

function bundleLib(target) {
  return {
    mode: 'production',
    entry: {
      [`baqend.${target}`]: `./lib/index.${target}.ts`,
      [`baqend.${target}.min`]: `./lib/index.${target}.ts`,
    },
    output: {
      path: path.resolve(__dirname, 'dist/bundles/'),
      filename: '[name].js',
      libraryTarget: target === 'es2015' ? 'var' : 'umd',
      library: 'DB',
      umdNamedDefine: target !== 'es2015'
    },
    externals: {
      rxjs: 'rxjs',
      validator: 'validator'
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
      concatenateModules: target === 'es2015'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: [/node_modules/],
          loader: 'ts-loader',
          options: {
            compilerOptions: tsOptions[target]
          },
        },
      ],
    },
    stats: {
      optimizationBailout: true
    },
    plugins: [
      ...(target === 'es2015' ? [new EsmWebpackPlugin()]: []),
    ]
  }
}

const devSever = {
  mode: 'development',
  entry: {
    'chai-as-promised': require.resolve('chai-as-promised')
  },
  output: {
    path: path.resolve(__dirname, '.'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'chaiAsPromised',
    umdNamedDefine: true
  },
  devServer: {
    contentBase: path.join(__dirname, '.'),
    port: 8000
  },
  devtool: 'source-map',
  node: false,
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'tpl/debug.tpl'),
      filename: 'index.html',
      templateParameters: {
        testScripts
      },
      inject: false
    }),
  ]
}

console.log(devSever)

module.exports = [
  devSever,
  bundleLib('es5'),
  bundleLib('es2015'),
]