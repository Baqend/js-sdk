const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const EsmWebpackPlugin = require('@purtuga/esm-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');
const pkg = require('./package.json');

const copyright = fs.readFileSync('LICENSE.md', { encoding: 'utf-8' }).split(/[\r\n]/)[0];
const dirCont = fs.readdirSync('./spec');
const testScripts = dirCont.filter((elm) => elm.endsWith('.spec.js'));

const date = new Date().toUTCString();
const longBanner = `/*!
* ${pkg.description} ${pkg.version}
* ${pkg.homepage}
*
* ${copyright}
*
* Includes:
* uuid - https://github.com/uuidjs/uuid
* Copyright (c) 2010-2020 Robert Kieffer and other contributors
*
* Released under the MIT license
*
* Date: ${date}
*/
`;

const tsOptions = {
  es5: {
    target: 'es5',
    module: 'commonjs',
    importHelpers: true,
  },
  es2015: {
    target: 'es6',
    module: 'es2015',
  },
};

function bundleLib(target) {
  return {
    name: target,
    mode: 'production',
    entry: {
      [`baqend.${target}`]: './lib/index.ts',
      [`baqend.${target}.min`]: './lib/index.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: '[name].js',
      libraryTarget: target === 'es2015' ? 'var' : 'umd',
      library: 'Baqend',
      umdNamedDefine: target !== 'es2015',
    },
    externals: {
      rxjs: 'rxjs',
      validator: 'validator',
    },
    resolve: {
      extensions: ['.ts'],
      aliasFields: ['browser'],
    },
    devtool: 'source-map',
    node: false,
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          include: /\.min\.js$/,
          extractComments: {
            banner: (licenseFile) => `${pkg.name} ${pkg.version} | ${copyright} | License information ${licenseFile}`,
          },
        }),
      ],
      concatenateModules: target === 'es2015',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: [/node_modules/],
          loader: 'ts-loader',
          options: {
            onlyCompileBundledFiles: true,
            configFile: 'tsconfig.lib.json',
            compilerOptions: tsOptions[target],
          },
        },
      ],
    },
    stats: {
      optimizationBailout: true,
    },
    plugins: [
      ...(target === 'es2015' ? [new EsmWebpackPlugin()] : []),
      new webpack.BannerPlugin({
        banner: longBanner,
        raw: true,
        entryOnly: true,
      }),
    ],
  };
}

const devSever = {
  name: 'dev-server',
  mode: 'development',
  entry: {
    'chai-as-promised': require.resolve('chai-as-promised'),
  },
  output: {
    path: path.resolve(__dirname, '.'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'chaiAsPromised',
    umdNamedDefine: true,
  },
  devServer: {
    contentBase: path.join(__dirname, '.'),
    port: 8000,
  },
  devtool: 'source-map',
  node: false,
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'tpl/debug.tpl'),
      filename: 'index.html',
      templateParameters: {
        testScripts,
      },
      inject: false,
    }),
  ],
};

module.exports = [
  devSever,
  bundleLib('es5'),
  bundleLib('es2015'),
];
