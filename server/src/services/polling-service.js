import moment from 'moment/moment';

import logger from '../logger/logger';
import ConfigService from './config-service';
import EthereumAPIService from '../api/services/ethereum-api-service';

import { ALLOWED_HOURS_BACK, ALLOWED_TIME_BASIS } from '../common/app-const';

const HISTORICAL_STATS_INTERVAL_KEY = {
    PRICE_AND_PENDING_TXS: 'priceAndPendingTxs'
};

const API_INTERVAL_KEY = {
    TOP_VOLUME_TO: 'topVolumeTo',
    EXCHANGES    : 'exchanges',
    BLOCKCHAIN   : 'blockchain',
    PRICE        : 'price'
};

const HISTORICAL_STATS_INTERVAL_CONFIG = {
    [HISTORICAL_STATS_INTERVAL_KEY.PRICE_AND_PENDING_TXS]: {
        key     : HISTORICAL_STATS_INTERVAL_KEY.PRICE_AND_PENDING_TXS,
        interval: null,
        promises: [
            EthereumAPIService.generateHistoricalPriceStats,
            EthereumAPIService.generateHistoricalBlockchainStats
        ],
        intervalInMin          : ConfigService.getStatRegenerationInMinutes(),
        nextStatsGenerationDate: null,
        lastStatsGenerationDate: null
    }
};

const API_INTERVAL_CONFIG = {
    [API_INTERVAL_KEY.TOP_VOLUME_TO]: {
        key           : API_INTERVAL_KEY.TOP_VOLUME_TO,
        interval      : null,
        url           : ConfigService.getVolumeAPIUrl(),
        requestsPerDay: ConfigService.getVolumeMaxRequestsPerDay(),
        promise       : EthereumAPIService.getAndCacheTopVolumeTo
    },
    [API_INTERVAL_KEY.EXCHANGES]: {
        key           : API_INTERVAL_KEY.EXCHANGES,
        interval      : null,
        url           : ConfigService.getExchangesAPIURLs(),
        requestsPerDay: ConfigService.getExchangesMaxRequestsPerDay(),
        promise       : EthereumAPIService.getAndCacheExchangesAndCoinInfo
    },
    [API_INTERVAL_KEY.BLOCKCHAIN]: {
        key           : API_INTERVAL_KEY.BLOCKCHAIN,
        interval      : null,
        url           : ConfigService.getBlockchainAPIUrl(),
        token         : ConfigService.getBlockchainAPIToken(),
        requestsPerDay: ConfigService.getBlockchainAPIMaxRequestsPerDay(),
        promise       : EthereumAPIService.getAndStoreBlockchainInfo
    },
    [API_INTERVAL_KEY.PRICE]: {
        key           : API_INTERVAL_KEY.PRICE,
        interval      : null,
        url           : ConfigService.getPriceAPIUrl(),
        requestsPerDay: ConfigService.getPriceAPIMaxRequestsPerDay(),
        promise       : EthereumAPIService.getAndStorePriceInfo
    }
};

let svc = {};
const PollingService = svc = {
    getNextStatisticsDate () {
        const { nextStatsGenerationDate } = HISTORICAL_STATS_INTERVAL_CONFIG[HISTORICAL_STATS_INTERVAL_KEY.PRICE_AND_PENDING_TXS];
        if (!nextStatsGenerationDate) {
            return null;
        }
        return nextStatsGenerationDate.toDate();
    },
    scheduleHistoricalStatisticsGeneration () {
        Object.keys(HISTORICAL_STATS_INTERVAL_CONFIG).forEach(configKey => {
            svc.scheduleHistoricalStatisticsGenerationWithConfig(HISTORICAL_STATS_INTERVAL_CONFIG[configKey]);
        });
    },
    scheduleHistoricalStatisticsGenerationWithConfig (config) {
        let promises = [];
        ALLOWED_HOURS_BACK.forEach((hoursBack, hoursIndex) => {
            ALLOWED_TIME_BASIS.forEach((timeBasis, intervalIndex) => {
                promises = [
                    ...promises,
                    ...svc.generateChartDataFromConfigPromises(config.key, config.promises, hoursBack, timeBasis, { outer: hoursIndex, inner: intervalIndex })
                ];
            });
        });
        Promise
            .all(promises)
            .then(() => {
                config.lastStatsGenerationDate = new Date();
                config.nextStatsGenerationDate = moment(svc.lastStatsGenerationDate).add(config.intervalInMin, 'minutes');
                if (!config.interval) {
                    config.interval = setInterval(svc.scheduleHistoricalStatisticsGeneration.bind(this, config), config.intervalInMin * 60 * 1000);
                    __logStatsGenerationInterval(config.intervalInMin, config.nextStatsGenerationDate);
                }
            })
            .catch(error => {
                logger.error(error);
            });
    },
    generateChartDataFromConfigPromises (configKey, dataPromises, hoursBack, timeInterval, timeoutOptions) {
        const BASE_DELAY_IN_SECONDS = 5;
        const { outer, inner } = timeoutOptions;
        return new Promise(resolve => {
            let delay = BASE_DELAY_IN_SECONDS + (outer * 10);
            if (inner) {
                delay += (inner * 5);
            }
            __logChartDataConfig(configKey, delay, hoursBack, timeInterval);
            dataPromises.forEach(promise => {
                setTimeout(() => promise(hoursBack, timeInterval, timeoutOptions), delay * 1000);
            });
            resolve();
        });
    },
    scheduleAPIPolling () {
        Object.keys(API_INTERVAL_CONFIG).forEach((configKey, index) => {
            svc.scheduleAPIPollingWithConfig(API_INTERVAL_CONFIG[configKey], index);
            logger.info('');
        });
    },
    scheduleAPIPollingWithConfig (config, index = 0) {
        if (!config.interval) {
            const requestsPerSec = (60 * 60 * 24) / config.requestsPerDay;
            __logAPIIntervalConfig(config, index, requestsPerSec);
            config
                .promise()
                .then(() => {
                    config.interval = setInterval(config.promise, requestsPerSec * 1000);
                });
        }
    },
    stopAPIPolling () {
        Object.keys(API_INTERVAL_CONFIG).forEach((configKey, index) => {
            const config = API_INTERVAL_CONFIG[configKey];
            if (config.interval) {
                logger.info(`Stopping polling interval #${index + 1} (${config.key})`);
                clearInterval(config.interval);
                config.interval = null;
            }
        });
    }
};

function __logAPIIntervalConfig (config, index, requestsPerSec) {
    logger.info(`Scheduling polling interval #${index + 1} (${config.key})`);
    logger.info(`  ${'\u2713'} ${config.requestsPerDay} requests per day (Every ${requestsPerSec.toFixed(2)} sec)`);
    if (config.token) {
        logger.info(`  ${'\u2713'} ${config.token}`);
    } else {
        logger.info(`  ${'\u2718'} No Token`);
    }
}

function __logStatsGenerationInterval (intervalInMin, nextStatsGenerationDate) {
    logger.info(`Scheduling future statistics generations for ${nextStatsGenerationDate.format('L LTS')}`);
    logger.info(`Regenerating every ${intervalInMin} min(s) (${intervalInMin * 60} secs)`);
}

function __logChartDataConfig (configKey, delay, hoursBack, timeInterval) {
    logger.info(`Scheduling ${configKey} stats generation in ${delay} seconds. (hoursBack=${hoursBack}, timeBasis=${timeInterval})`);
}

export default PollingService;
