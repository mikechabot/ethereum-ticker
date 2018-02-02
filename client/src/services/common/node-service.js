'use strict';

let svc;
module.exports = svc = {
    getNodeEnv: function () {
        return process.env;
    },
    getNodeEnvByKey: function (key) {
        if (!key) throw new Error('Key cannot be null/undefined');
        return process.env[key];
    },
    getNodeEnvMode: function () {
        return svc.getNodeEnvByKey('NODE_ENV') || 'test';
    },
    isProduction: function () {
        return svc.getNodeEnvMode() === 'production';
    },
    isDevelopment: function () {
        return svc.getNodeEnvMode() === 'development';
    },
    isTest: function () {
        return !svc.getNodeEnvMode() || svc.getNodeEnvMode() === 'test';
    }
};
