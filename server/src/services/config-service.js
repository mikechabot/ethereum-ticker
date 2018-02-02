'use strict';

import DomainObjectService from './domain-object-service';
import configFile from '../../config/config.json';

const instance = new Configuration(configFile);

export default {
    getConfig () {
        return instance.getConfig();
    },
    getPort () {
        return instance.getRequiredProperty('port');
    },
    getMongoUrl () {
        return instance.getRequiredProperty('mongoUrl');
    },
    getLogFilePath () {
        return instance.getRequiredProperty('logFilePath');
    },
    getWhitelist () {
        return instance.getRequiredProperty('whitelist');
    },
    getMaxRequestsPerHour () {
        return instance.getRequiredProperty('maxRequestsPerHour');
    },
    getAPIToken () {
        return instance.getRequiredProperty('apiToken');
    }
};

function Configuration (config) {
    if (!config) throw new Error('Missing required configuration');
    this.config = config;
}

Configuration.prototype.getConfig = function () {
    return this.config;
};

Configuration.prototype.getProperty = function (key) {
    if (!key) throw new Error('key cannot be null/undefined');
    return DomainObjectService.getPropertyValue(this.getConfig(), key);
};

Configuration.prototype.getRequiredProperty = function (key) {
    const value = this.getProperty(key);
    if (!value) throw new Error(`Missing required property: "${key}"`);
    return value;
};
