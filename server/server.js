'use strict';

const StartupService = require('./lib/services/startup-service');
const logger = require('./lib/logger/logger').default;

const BASE_DELAY = 3000;

StartupService
    .startApp()
    .then(() => {
        const PollingService = require('./lib/services/polling-service').default;
        setTimeout(PollingService.scheduleAPIPolling, BASE_DELAY);
        setTimeout(PollingService.scheduleHistoricalStatisticsGeneration, BASE_DELAY);
    })
    .catch(error => {
        logger.error(error);
        process.exit(1);
    });
