'use strict';

const StartupService = require('./lib/services/startup-service');
const logger = require('./lib/logger/logger').default;

StartupService
    .startApp()
    .then(() => {
        logger.info('App Started');
    })
    .catch(error => {
        logger.error(error);
        process.exit(1);
    });
