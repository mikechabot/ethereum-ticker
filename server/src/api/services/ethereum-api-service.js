import moment from 'moment';
import Maybe from 'maybe-baby';
import SortableMap from 'sortable-map';
import _groupBy from 'lodash/groupBy';
import _minBy from 'lodash/minBy';
import _maxBy from 'lodash/maxBy';

import DataAccessService from '../../services/data-access-service';
import MongooseService from '../../services/mongoose-service';
import ConfigService from '../../services/config-service';
import logger from '../../logger/logger';
import MailerService from '../../services/mailer-service';
import {ALLOWED_HOURS_BACK, ALLOWED_TIME_BASIS} from '../../common/app-const';

const EMAIL_SUBJECT = '*Blockchain Alert* ETH pending transactions crossed above threshold';
const EMAIL_MESSAGE = function (pendingTxs) {
    return `Pending transaction count: <strong style="color: red">${pendingTxs}</strong><br/>Configured threshold: <strong style="color: green">${ConfigService.getPendingTxThreshold()}</strong><br/><br/>This email was generated automatically by <a href="http://marketmovers.io">http://marketmovers.io</a>.`;
};

const { DOMAIN_PROPERTY, QUERY_PROPERTY } = MongooseService;

const blockchainModel = MongooseService.MODELS.ETH_BLOCKCHAIN;
const priceModel = MongooseService.MODELS.ETH_PRICE;

let blockchainInterval;
let priceInterval;
let statsInterval;

let currentEthUsdDelta = -1;

const STAT_GENERATION_INTERVAL_IN_MINUTES = ConfigService.getStatRegenerationInMinutes();
const STAT_GENERATION_INTERVAL_IN_SECONDS = 60 * STAT_GENERATION_INTERVAL_IN_MINUTES;
const STAT_GENERATION_INTERVAL_IN_MILLISECONDS = 1000 * STAT_GENERATION_INTERVAL_IN_SECONDS;

const apiIntervals = {
    blockchainInterval,
    priceInterval
};

let lastAlertSent;

const cache = new SortableMap();

function __generateParameters (hoursBack) {
    const params = {};
    if (hoursBack) {
        params[DOMAIN_PROPERTY.CREATED_DATE] = {
            [QUERY_PROPERTY.GREATER_THAN_OR_EQUAL]: new Date(moment().subtract(hoursBack, 'hours').startOf('hour').toString())
        };
    }
    return params;
}

let svc = {};
const EthereumAPIService = svc = {
    cache,
    apiIntervals,
    statsInterval,
    lastAlertSent,
    getBlockchainInfoFromAPI () {
        let url = ConfigService.getBlockchainAPIUrl();
        const token = ConfigService.getBlockchainAPIToken();
        if (token) {
            url = `${url}?token=${token}`;
        }
        return DataAccessService.get(url);
    },
    getPriceInfoFromAPI () {
        return DataAccessService.get(ConfigService.getPriceAPIUrl());
    },
    getAndSaveBlockchainInfo () {
        return new Promise((resolve, reject) => {
            svc.getBlockchainInfoFromAPI()
                .then(blockchain => MongooseService.saveNewObject(blockchainModel, blockchain))
                .then(info => {
                    const maybeCount = Maybe.of(info.unconfirmed_count);
                    if ((!svc.lastAlertSent || moment().subtract(ConfigService.getSendAlertInterval(), 'minutes').isAfter(svc.lastAlertSent)) &&
                        maybeCount.isJust() &&
                        maybeCount.join() >= ConfigService.getPendingTxThreshold()) {
                        MailerService
                            .sendMessage(
                                EMAIL_SUBJECT,
                                EMAIL_MESSAGE(maybeCount.join())
                            )
                            .then(() => {
                                svc.lastAlertSent = new Date();
                                resolve(info);
                            })
                            .catch(error => {
                                logger.error(error);
                                reject(error);
                            });
                    } else {
                        resolve(info);
                    }
                })
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getAndSavePriceInfo () {
        return new Promise((resolve, reject) => {
            svc.getPriceInfoFromAPI()
                .then(price => {
                    if (Maybe.of(price.RAW.ETH.BTC).isJust() &&
                        Maybe.of(price.RAW.ETH.USD).isJust()) {
                        return MongooseService.saveNewObject(priceModel, {
                            RAW: {
                                ETH: {
                                    USD: {
                                        PRICE: Maybe.of(price.RAW.ETH.USD.PRICE).join()
                                    },
                                    BTC: {
                                        PRICE: Maybe.of(price.RAW.ETH.BTC.PRICE).join()
                                    }
                                }
                            }
                        });
                    }
                })
                .then(resolve)
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getCurrentBlockchainInfo () {
        return new Promise((resolve, reject) => {
            MongooseService
                .find(blockchainModel, {
                    limit: 2,
                    sort : {
                        [MongooseService.DOMAIN_PROPERTY.ID]: -1
                    }
                })
                .then(results => {
                    const latest = results[0];
                    latest.pendingTxDelta = latest.unconfirmed_count - (results[1] ? results[1].unconfirmed_count : 0);
                    resolve(latest);
                })
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getCurrentPriceInfo () {
        return new Promise((resolve, reject) => {
            MongooseService
                .find(priceModel, {
                    limit: 2,
                    sort : {
                        [MongooseService.DOMAIN_PROPERTY.ID]: -1
                    }
                })
                .then(prices => {
                    const latestEthPrice = prices[0];
                    const prevEthPrice = prices[1];

                    const { ETH } = latestEthPrice.RAW;
                    const { BTC, USD} = ETH;

                    const ethUsdDelta = (USD.PRICE - (prevEthPrice ? prevEthPrice.RAW.ETH.USD.PRICE : 0)).toFixed(2);
                    if (ethUsdDelta !== '0.00') {
                        currentEthUsdDelta = ethUsdDelta;
                    }

                    resolve({
                        BTC      : Maybe.of(BTC.PRICE).orElse(-1).join(),
                        USD      : USD.PRICE,
                        USD_delta: currentEthUsdDelta
                    });
                })
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getHistoricalBlockchainInfo (hoursBack = 1, timeBasis = 'hour') {
        const cacheKey = `blockchain-${hoursBack}-${timeBasis}`;
        if (svc.cache.has(cacheKey)) {
            const cached = svc.cache.find(cacheKey);
            if (moment().subtract(STAT_GENERATION_INTERVAL_IN_MINUTES, 'minutes').isBefore(cached[DOMAIN_PROPERTY.CREATED_DATE])) {
                logger.info(`CACHE: Found valid cached data. (cacheKey: ${cacheKey})`);
                return Promise.resolve(cached.data);
            } else {
                logger.info(`CACHE: Cache outdated. (cacheKey: ${cacheKey})`);
            }
        } else {
            logger.info(`CACHE: No cached value detected. (cacheKey: ${cacheKey})`);
        }
        return Promise.reject(new Error('CACHE: Cache not ready'));
    },
    generateHistoricalBlockchainStats (hoursBack = 1, timeBasis = 'hour', timeoutOptions) {
        const cacheKey = `blockchain-${hoursBack}-${timeBasis}`;

        const __generate = () => {
            return new Promise((resolve, reject) => {
                if (svc.cache.has(cacheKey)) {
                    logger.info(`CACHE: Purging historical blockchain statistics. (cacheKey=${cacheKey}, hoursBack=${hoursBack}, timeBasis=${timeBasis})`);
                    svc.cache.delete(cacheKey);
                }
                logger.info(`CACHE: Generating historical blockchain statistics. (cacheKey=${cacheKey}, hoursBack=${hoursBack}, timeBasis=${timeBasis})`);
                MongooseService
                    .find(blockchainModel, {
                        params: __generateParameters(hoursBack),
                        sort  : {
                            [MongooseService.DOMAIN_PROPERTY.ID]: 1
                        }
                    })
                    .then(blockchainInfos => svc.normalizeBlockchainInfosByTimeBase(blockchainInfos, timeBasis))
                    .then(normalizedBlockchainInfos => svc.generateLineDataFromBlockchainInfos(normalizedBlockchainInfos, timeBasis))
                    .then(historicalBlockchainInfo => {
                        logger.info(`CACHE: Caching historical blockchain statistics. (cacheKey=${cacheKey}, hoursBack=${hoursBack}, timeBasis=${timeBasis})`);
                        svc.cache.add(cacheKey, {
                            [DOMAIN_PROPERTY.CREATED_DATE]: new Date(),
                            data                          : historicalBlockchainInfo
                        });
                        resolve(historicalBlockchainInfo);
                    })
                    .catch(error => {
                        logger.error(error);
                        reject(error);
                    });
            });
        };

        if (!timeoutOptions) {
            return __generate();
        } else {
            setTimeout(__generate, timeoutOptions.outer * 1000);
        }
    },
    generateHistoricalPriceStats (hoursBack = 1, timeBasis = 'hour', timeoutOptions) {
        const cacheKey = `price-${hoursBack}-${timeBasis}`;

        const __generate = () => {
            return new Promise((resolve, reject) => {
                if (svc.cache.has(cacheKey)) {
                    logger.info(`CACHE: Purging historical price statistics. (cacheKey=${cacheKey}, hoursBack=${hoursBack}, timeBasis=${timeBasis})`);
                    svc.cache.delete(cacheKey);
                }
                logger.info(`CACHE: Generating historical price statistics. (cacheKey=${cacheKey}, hoursBack=${hoursBack}, timeBasis=${timeBasis})`);
                MongooseService
                    .find(priceModel, {
                        params: __generateParameters(hoursBack),
                        sort  : {
                            [MongooseService.DOMAIN_PROPERTY.ID]: 1
                        }
                    })
                    .then(prices => svc.normalizePricesByTimeBasis(prices, timeBasis))
                    .then(normalizedPrices => svc.generateCandlestickDataFromNormalizedPrices(normalizedPrices))
                    .then(historicalPrices => {
                        logger.info(`CACHE: Caching historical price statistics. (cacheKey=${cacheKey}, hoursBack=${hoursBack}, timeBasis=${timeBasis})`);
                        svc.cache.add(cacheKey, {
                            [DOMAIN_PROPERTY.CREATED_DATE]: new Date(),
                            data                          : historicalPrices
                        });
                        resolve(historicalPrices);
                    })
                    .catch(error => {
                        logger.error(error);
                        reject(error);
                    });
            });
        };

        if (!timeoutOptions) {
            return __generate();
        } else {
            setTimeout(__generate, timeoutOptions.outer * 1000);
        }
    },
    normalizeBlockchainInfosByTimeBase (blockInfos, timeBasis = 'hour') {
        if (!blockInfos || blockInfos.length === 0) {
            return [];
        } else {
            return blockInfos.map(blockInfo => {
                return {
                    y                             : blockInfo.unconfirmed_count,
                    x                             : moment(blockInfo[DOMAIN_PROPERTY.CREATED_DATE]).startOf(timeBasis),
                    [DOMAIN_PROPERTY.ID]          : blockInfo[DOMAIN_PROPERTY.ID],
                    [DOMAIN_PROPERTY.CREATED_DATE]: blockInfo[DOMAIN_PROPERTY.CREATED_DATE]
                };
            }).filter(info => info.y > 100);
        }
    },
    normalizePricesByTimeBasis (prices, timeBasis = 'hour') {
        if (!prices || prices.length === 0) {
            return [];
        } else {
            return prices.map(price => {
                if (Maybe.of(price.RAW.ETH.USD).isNothing()) {
                    return null;
                }
                return {
                    y                             : price.RAW.ETH.USD.PRICE,
                    x                             : moment(price[DOMAIN_PROPERTY.CREATED_DATE]).startOf(timeBasis),
                    [DOMAIN_PROPERTY.ID]          : price[DOMAIN_PROPERTY.ID],
                    [DOMAIN_PROPERTY.CREATED_DATE]: price[DOMAIN_PROPERTY.CREATED_DATE]
                };
            }).filter(price => !!price);
        }
    },
    generateLineDataFromBlockchainInfos (normalizedBlockchainInfos) {
        if (!normalizedBlockchainInfos || normalizedBlockchainInfos.length === 0) {
            return [];
        } else {
            const groupsByDate = _groupBy(normalizedBlockchainInfos, 'x');
            return Object.keys(groupsByDate).map(date => {
                const group = groupsByDate[date];
                const max = _maxBy(group, 'y');
                return {
                    x: date,
                    y: max.y
                };
            });
        }
    },
    generateCandlestickDataFromNormalizedPrices (normalizedPrices) {
        if (!normalizedPrices || normalizedPrices.length === 0) {
            return [];
        } else {
            const pricesByDate = _groupBy(normalizedPrices, 'x');
            return Object.keys(pricesByDate).map(date => {
                const group = pricesByDate[date];

                const open = _minBy(group, DOMAIN_PROPERTY.CREATED_DATE);
                const low = _minBy(group, 'y');
                const high = _maxBy(group, 'y');
                const close = _maxBy(group, DOMAIN_PROPERTY.CREATED_DATE);

                return {
                    x: date,
                    y: [open.y, high.y, low.y, close.y]
                };
            });
        }
    },
    getHistoricalPriceInfoLastNDays (hoursBack = 1, timeBasis = 'hour') {
        const cacheKey = `price-${hoursBack}-${timeBasis}`;
        if (svc.cache.has(cacheKey)) {
            const cached = svc.cache.find(cacheKey);
            if (moment().subtract(STAT_GENERATION_INTERVAL_IN_MINUTES, 'minutes').isBefore(cached[DOMAIN_PROPERTY.CREATED_DATE])) {
                logger.info(`CACHE: Found valid cached data. (cacheKey: ${cacheKey})`);
                return Promise.resolve(cached.data);
            } else {
                logger.info(`CACHE: Cache outdated. (cacheKey: ${cacheKey})`);
            }
        } else {
            logger.info(`CACHE: No cached value detected. (cacheKey: ${cacheKey})`);
        }
        return Promise.reject(new Error('CACHE: Cache not ready'));
    },
    generateChartData (hoursBack, timeInterval, timeoutOptions) {
        const BASE_DELAY_IN_SECONDS = 5;
        const { outer, inner } = timeoutOptions;
        return new Promise(resolve => {
            let delay = BASE_DELAY_IN_SECONDS + (outer * 10);
            if (inner) {
                delay += (inner * 5);
            }
            logger.info(`Scheduling statistics generation in ${delay} seconds. (hoursBack=${hoursBack}, timeBasis=${timeInterval})`);
            setTimeout(() => resolve(
                Promise.all([
                    svc.generateHistoricalPriceStats(hoursBack, timeInterval, timeoutOptions),
                    svc.generateHistoricalBlockchainStats(hoursBack, timeInterval, timeoutOptions)
                ])
            ), delay * 1000);
        });
    },
    generateHistoricalStatistics () {
        let promises = [];
        ALLOWED_HOURS_BACK.forEach((hoursBack, hoursIndex) => {
            ALLOWED_TIME_BASIS.forEach((timeBasis, intervalIndex) => {
                promises = [
                    ...promises,
                    ...svc.generateChartData(hoursBack, timeBasis, { outer: hoursIndex, inner: intervalIndex})
                ];
            });
        });
        Promise
            .all(promises)
            .then(() => {
                if (!svc.statsInterval) {
                    logger.info('Scheduling future statistics generations');
                    logger.info(`Regeneration every ${STAT_GENERATION_INTERVAL_IN_MINUTES} min(s) ${STAT_GENERATION_INTERVAL_IN_SECONDS} secs`);
                    svc.statsInterval = setInterval(svc.generateHistoricalStatistics, STAT_GENERATION_INTERVAL_IN_MILLISECONDS);
                }
            })
            .catch(error => {
                logger.error(error);
            });
    },
    startPolling () {
        svc.startPollingWithConfigs([
            {
                key           : 'blockchain',
                interval      : apiIntervals.blockchainInterval,
                url           : ConfigService.getBlockchainAPIUrl(),
                token         : ConfigService.getBlockchainAPIToken(),
                requestsPerDay: ConfigService.getBlockchainAPIMaxRequestsPerDay(),
                promise       : svc.getAndSaveBlockchainInfo
            },
            {
                key           : 'price',
                interval      : apiIntervals.priceInterval,
                url           : ConfigService.getPriceAPIUrl(),
                requestsPerDay: ConfigService.getPriceAPIMaxRequestsPerDay(),
                promise       : svc.getAndSavePriceInfo
            }

        ]);
    },
    startPollingWithConfigs (configs) {
        if (configs && configs.length > 0) {
            configs.forEach((config, index) => {
                if (config) {
                    svc.startPollingWithConfig(config, index);
                }
            });
            logger.info('************************************************');
        }
    },
    startPollingWithConfig (config, index = 0) {
        if (!config.interval) {
            const requestsPerSec = (60 * 60 * 24) / config.requestsPerDay;
            logger.info('************************************************');
            logger.info(`Starting ETH ${config.key} polling (Interval #${index + 1})`);
            logger.info(`Using API @ ${config.url}`);
            logger.info(`Maximum requests per day: ${config.requestsPerDay}`);
            logger.info(`Polling interval: ${requestsPerSec} seconds`);
            logger.info(`API Token: ${config.token || 'None'}`);
            config.promise()
                .then(() => {
                    config.interval = setInterval(config.promise, requestsPerSec * 1000);
                });
        }
    },
    stopPolling () {
        Object.keys(svc.apiIntervals).forEach(key => {
            const interval = apiIntervals[key];
            if (interval) {
                logger.info(`Stopping ETH polling interval #${index + 1}`);
                clearInterval(blockchainInterval);
                blockchainInterval = undefined;
            }
        });
    }
};

export default EthereumAPIService;
