'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _log4js = require('log4js');

var _log4js2 = _interopRequireDefault(_log4js);

var _log4jsConfig = require('./log4js-config');

var _log4jsConfig2 = _interopRequireDefault(_log4jsConfig);

var _configService = require('../services/config-service');

var _configService2 = _interopRequireDefault(_configService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_log4js2.default.configure(_log4jsConfig2.default, { cwd: _configService2.default.getLogFilePath() });

var logger = process.env.NODE_ENV !== 'test' ? _log4js2.default.getLogger('main') : {
    info: function info() {},
    debug: function debug() {},
    error: function error() {},
    warn: function warn() {}
};

exports.default = logger;