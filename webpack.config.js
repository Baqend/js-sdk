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
      libraryTarget: 'umd',
      library: 'DB',
      umdNamedDefine: true
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
    }
  }
}

const devSever = {
  mode: 'production',
  entry: {

  },
  output: {
    path: path.resolve(__dirname, 'build/'),
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 8000
  }
}

module.exports = [
  bundleLib('es5'),
  bundleLib('es2015'),
  // devSever
]