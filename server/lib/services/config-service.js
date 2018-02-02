'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _domainObjectService = require('./domain-object-service');

var _domainObjectService2 = _interopRequireDefault(_domainObjectService);

var _config = require('../../config/config.json');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var instance = new Configuration(_config2.default);

exports.default = {
    getConfig: function getConfig() {
        return instance.getConfig();
    },
    getPort: function getPort() {
        return instance.getRequiredProperty('port');
    },
    getMongoUrl: function getMongoUrl() {
        return instance.getRequiredProperty('mongoUrl');
    },
    getLogFilePath: function getLogFilePath() {
        return instance.getRequiredProperty('logFilePath');
    },
    getWhitelist: function getWhitelist() {
        return instance.getRequiredProperty('whitelist');
    },
    getMaxRequestsPerHour: function getMaxRequestsPerHour() {
        return instance.getRequiredProperty('maxRequestsPerHour');
    },
    getAPIToken: function getAPIToken() {
        return instance.getRequiredProperty('apiToken');
    }
};


function Configuration(config) {
    if (!config) throw new Error('Missing required configuration');
    this.config = config;
}

Configuration.prototype.getConfig = function () {
    return this.config;
};

Configuration.prototype.getProperty = function (key) {
    if (!key) throw new Error('key cannot be null/undefined');
    return _domainObjectService2.default.getPropertyValue(this.getConfig(), key);
};

Configuration.prototype.getRequiredProperty = function (key) {
    var value = this.getProperty(key);
    if (!value) throw new Error('Missing required property: "' + key + '"');
    return value;
};