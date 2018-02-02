'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const CleanPlugin = require('./utils/clean-plugin');
const NodeUtils = require('./src/services/common/node-service');
const appConfig = require('./config/config');

const config = {
    output: {
        path    : path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json']
    },
    plugins: [
        new CleanPlugin({
            files: ['dist/*']
        }),
        new ExtractTextPlugin('css/bundle.css'),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: [
                    autoprefixer({
                        browsers: ['last 2 version']
                    })
                ]
            }
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            inject  : 'body'
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(
                    process.env.NODE_ENV
                ),
                APP_CONFIG: JSON.stringify(
                    appConfig
                )
            }
        })
    ],
    module: {
        exprContextCritical: false, // Suppress "The request of a dependency is an expression"
        rules              : [
            {
                test   : /\.(js|jsx)$/,
                loaders: 'babel-loader',
                include: path.join(__dirname, 'src')
            },
            {
                test   : /\.scss$/,
                loader : ExtractTextPlugin.extract({fallback: 'style-loader', use: 'css-loader!sass-loader'}),
                include: path.join(__dirname, 'src')
            },
            {
                test   : /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader : 'url-loader?limit=10000&name=[name]-[hash].[ext]',
                include: path.join(__dirname, 'src')
            },
            {
                test   : /\.json$/,
                loader : 'json-loader',
                include: path.join(__dirname, 'src')
            }
        ]
    }
};

if (NodeUtils.isProduction()) {
    config.entry = './src/Bootstrap';
    config.plugins.push(new UglifyJSPlugin());

} else {
    config.devtool = 'eval';
    config.entry = [
        'react-hot-loader/patch',
        `webpack-dev-server/client?http://localhost:${appConfig.example.port}`,
        'webpack/hot/only-dev-server',
        './src/Bootstrap'
    ];
    config.plugins.push(
        new webpack.HotModuleReplacementPlugin()
    );
}

module.exports = config;
