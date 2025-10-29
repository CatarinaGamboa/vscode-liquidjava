//@ts-check

'use strict';

const path = require('path');
const fs = require('fs');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js context
  mode: 'none', // leave the source code as close as possible to the original

  entry: './src/extension.ts', // the entry point of this extension
  output: {
    // the bundle is stored in the 'dist' folder
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    // support reading TypeScript and JavaScript files
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    // Copy server JAR to dist folder after build
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('CopyServerJar', () => {
          const serverDir = path.resolve(__dirname, 'dist', 'server');
          const jarSource = path.resolve(__dirname, 'server', 'language-server-liquidjava.jar');
          const jarDest = path.resolve(serverDir, 'language-server-liquidjava.jar');
          if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
          }
          if (fs.existsSync(jarSource)) {
            fs.copyFileSync(jarSource, jarDest);
            console.log('Copied language-server-liquidjava.jar to dist/server/');
          } else {
            console.warn('Warning: language-server-liquidjava.jar not found at', jarSource);
            console.warn('Run: cd ../server && mvn clean package');
          }
        });
      }
    }
  ]
};
module.exports = config;
