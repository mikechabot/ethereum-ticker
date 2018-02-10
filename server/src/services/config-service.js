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
    getBlockchainAPIUrl () {
        return instance.getRequiredProperty('api.blockchain.url');
    },
    getBlockchainAPIToken () {
        return instance.getProperty('api.blockchain.token');
    },
    getBlockchainAPIMaxRequestsPerDay () {
        return instance.getRequiredProperty('api.blockchain.maxRequestsPerDay');
    },
    getPriceAPIUrl () {
        return instance.getRequiredProperty('api.price.url');
    },
    getPriceAPIMaxRequestsPerDay () {
        return instance.getRequiredProperty('api.price.maxRequestsPerDay');
    },
    getStatRegenerationInMinutes () {
        return instance.getRequiredProperty('statistics.regenerationIntervalInMin');
    },
    getMailerKey () {
        return instance.getRequiredProperty('api.mailer.key');
    },
    getMailerDomain () {
        return instance.getRequiredProperty('api.mailer.domain');
    },
    getSendAlertInterval () {
        return instance.getRequiredProperty('alerts.sendAlertIntervalInMin');
    },
    getPendingTxThreshold () {
        return instance.getRequiredProperty('alerts.pendingTxThreshold');
    },
    getEmailRecipients () {
        return instance.getRequiredProperty('alerts.emailRecipients');
    },
    getExchangesAPIURLs () {
        return instance.getRequiredProperty('api.exchanges.urls');
    },
    getExchangesMaxRequestsPerDay () {
        return instance.getRequiredProperty('api.exchanges.maxRequestsPerDay');
    },
    getVolumeAPIUrl () {
        return instance.getRequiredProperty('api.topVolumeTo.url');
    },
    getVolumeMaxRequestsPerDay () {
        return instance.getRequiredProperty('api.topVolumeTo.maxRequestsPerDay');
    },
    getCoinSnapshotAPIURL () {
        return instance.getRequiredProperty('api.coin.url');
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
