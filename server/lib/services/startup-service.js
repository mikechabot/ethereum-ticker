'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _logger = require('../logger/logger');

var _logger2 = _interopRequireDefault(_logger);

var _configService = require('./config-service');

var _configService2 = _interopRequireDefault(_configService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MAX_PAYLOAD_SIZE = '50mb';

var StartupService = {
    startApp: function startApp() {
        var _this = this;

        _logger2.default.info('Starting xg-app-server');
        return new Promise(function (resolve, reject) {
            _this.initConfiguration().then(_this.configureMongoose).then(_this.verifyDatabaseConnectivity).then(_this.configureExpress).then(function (application) {
                _logger2.default.info('Startup complete');
                resolve(application);
            }).catch(function (error) {
                return reject(error);
            });
        });
    },
    initConfiguration: function initConfiguration() {
        return new Promise(function (resolve, reject) {
            try {
                var appConfig = _configService2.default.getConfig();
                _logger2.default.info('Listing application configuration');
                _logger2.default.info('=================================');
                for (var prop in appConfig) {
                    if (appConfig.hasOwnProperty(prop)) {
                        _logger2.default.info(prop + ': ' + JSON.stringify(appConfig[prop]));
                    }
                }
                _logger2.default.info('=================================');
                return resolve();
            } catch (error) {
                return reject(error);
            }
        });
    },
    configureMongoose: function configureMongoose() {
        return new Promise(function (resolve) {
            _logger2.default.info('Starting mongoose configuration');

            // Set Mongoose promise library
            _mongoose2.default.Promise = global.Promise;

            // Configure plugins
            var plugins = [{ description: 'Domain Properties', path: '../mongoose/plugin/domain-properties' }];

            _logger2.default.info('Configuring ' + plugins.length + ' Mongoose plugins...');
            plugins.forEach(function (plugin) {
                _logger2.default.info('Attaching ' + plugin.description + ' plugin');
                _mongoose2.default.plugin(require(plugin.path));
            });

            _logger2.default.info('Importing Mongoose Schemas...');
            require('../mongoose/schemas');

            _logger2.default.info('Completed mongoose configuration');
            resolve();
        });
    },
    verifyDatabaseConnectivity: function verifyDatabaseConnectivity() {
        var MONGO_URL = _configService2.default.getMongoUrl();
        _logger2.default.info('Attempting connection to ' + MONGO_URL);
        return new Promise(function (resolve, reject) {
            _mongoose2.default.connect(MONGO_URL, { useMongoClient: true }).then(function () {
                _getMongoDbVersion().then(resolve).catch(function (error) {
                    reject(error);
                });
            }, function (error) {
                return reject(error);
            });
        });
    },
    configureExpress: function configureExpress() {
        return new Promise(function (resolve) {
            var application = (0, _express2.default)();

            application.use((0, _morgan2.default)('combined', {
                stream: { write: function write(str) {
                        return _logger2.default.info(str);
                    } }
            }));

            application.disable('X-Powered-By');
            application.set('etag', false);

            application.use(_bodyParser2.default.json({ limit: MAX_PAYLOAD_SIZE }));
            application.use(_bodyParser2.default.urlencoded({ extended: false, limit: MAX_PAYLOAD_SIZE }));

            [{
                key: 'eth',
                controller: '../api/controllers/ethereum-api-controller',
                routes: '../api/routes/ethereum-api-routes'
            }].map(function (resource) {
                var routes = require(resource.routes).default;
                var controller = require(resource.controller).default;
                routes.configure(application, controller);
            });

            application.use(function (req, res, next) {
                var error = new Error('Not Found: ' + req.originalUrl);
                error.status = 404;
                return next(error);
            });

            application.use(function (error, req, res, next) {
                _logger2.default.error('Error occurred in route : ' + req.originalUrl);
                _logger2.default.error(error);
                var respBody = (0, _isString3.default)(error) ? error : error.message;
                res.status(error.status || 500);
                res.json(respBody);
            });

            _http2.default.createServer(application).listen(_configService2.default.getPort(), function () {
                _logger2.default.info('Express started. Listening on ' + _configService2.default.getPort());

                var EthereumAPIService = require('../api/services/ethereum-api-service').default;
                EthereumAPIService.startPolling();
            });
        });
    }
};

function _getMongoDbVersion() {
    return new Promise(function (resolve, reject) {
        var mongoAdmin = new _mongoose2.default.mongo.Admin(getDb());
        return mongoAdmin.buildInfo(function (error, info) {
            if (error) {
                reject(error);
            } else {
                _logger2.default.info('Successfully connected to MongoDB v' + info.version);
                resolve();
            }
        });
    });
}

function getConnection() {
    return _mongoose2.default.connection;
}

function getDb() {
    return getConnection().db;
}

module.exports = StartupService;