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
const coinInfoModel = MongooseService.MODELS.COIN_INFO;

let currentEthUsdDelta = -1;
let lastAlertSent;

const CACHE_KEY = {
    EXCHANGE_INFOS: 'exchangesInfos',
    TOP_VOLUME_TO : 'topVolumeTo'
};

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
    getTopVolumeToInfoFromAPI () {
        return DataAccessService.get(ConfigService.getVolumeAPIUrl());
    },
    getExchangesAndCoinInfoFromAPIs () {
        const promises = [];
        ConfigService.getExchangesAPIURLs().forEach(url => {
            promises.push(DataAccessService.get(url));
        });
        return Promise.all(promises);
    },
    getCurrentExchangeInfoFromCache () {
        return Promise.resolve(svc.cache.find('exchangesInfos'));
    },
    getCurrentTopVolumeToFromCache () {
        return Promise.resolve(svc.cache.find('topVolumeTo'));
    },
    getAndCacheExchangesAndCoinInfo () {
        return new Promise((resolve, reject) => {
            svc.getExchangesAndCoinInfoFromAPIs()
                .then(exchangeInfos => svc.__cacheExchangesInfo(exchangeInfos))
                .then(exchangeInfos => svc.__storeCoinInfo(exchangeInfos))
                .then(resolve)
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getAndCacheTopVolumeTo () {
        return new Promise((resolve, reject) => {
            svc.getTopVolumeToInfoFromAPI()
                .then(svc.__generateCoinPromises)
                .then(results => {
                    const { promises, topVolumeTo } = results;
                    Promise
                        .all(promises)
                        .then(coinInfo => svc.__attachCoinInfoToVolume(coinInfo, topVolumeTo))
                        .then(resolve)
                        .catch(error => {
                            logger.error(error);
                            reject(error);
                        });
                })
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getAndStoreBlockchainInfo () {
        return new Promise((resolve, reject) => {
            svc.getBlockchainInfoFromAPI()
                .then(blockchain => MongooseService.saveNewObject(blockchainModel, blockchain))
                .then(blockchain => svc.__checkThresholdStatus(blockchain))
                .then(resolve)
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getAndStorePriceInfo () {
        return new Promise((resolve, reject) => {
            svc.getPriceInfoFromAPI()
                .then(svc.__storePriceInfo)
                .then(resolve)
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getLatestBlockchainInfoFromDisk () {
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
    getLatestPriceInfoFromDisk () {
        return new Promise((resolve, reject) => {
            MongooseService
                .find(priceModel, {
                    limit: 2,
                    sort : {
                        [MongooseService.DOMAIN_PROPERTY.ID]: -1
                    }
                })
                .then(svc.__generatePriceObjectResponse)
                .then(resolve)
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getHistoricalBlockchainInfoFromCache (hoursBack = 1, timeBasis = 'hour') {
        const cacheKey = `blockchain-${hoursBack}-${timeBasis}`;
        if (svc.cache.has(cacheKey)) {
            const cached = svc.cache.find(cacheKey);
            if (moment().subtract(ConfigService.getStatRegenerationInMinutes(), 'minutes').isBefore(cached[DOMAIN_PROPERTY.CREATED_DATE])) {
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
            if (moment().subtract(ConfigService.getStatRegenerationInMinutes(), 'minutes').isBefore(cached[DOMAIN_PROPERTY.CREATED_DATE])) {
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
    __generatePriceObjectResponse (prices) {
        if (prices) {
            const latestEthPrice = prices[0];
            const prevEthPrice = prices[1];

            const { ETH } = latestEthPrice.RAW;
            const { BTC, USD} = ETH;

            const ethUsdDelta = (USD.PRICE - (prevEthPrice ? prevEthPrice.RAW.ETH.USD.PRICE : 0)).toFixed(2);
            if (ethUsdDelta !== '0.00') {
                currentEthUsdDelta = ethUsdDelta;
            }

            return {
                BTC      : Maybe.of(BTC.PRICE).orElse(-1).join(),
                USD      : USD.PRICE,
                USD_delta: currentEthUsdDelta,
                MKTCAP   : USD.MKTCAP
            };
        }
    },
    __attachCoinInfoToVolume (coinInfo, topVolumeTo) {
        topVolumeTo.Data.forEach(coin => {
            if (coin.ID !== -1) {
                const info = coinInfo.find(coinInfo => coinInfo.Data.General.Id === coin.ID);
                if (Maybe.of(() => info.Data.General).isJust()) {
                    const { General } = info.Data;
                    coin.info = {
                        url         : General.Url,
                        imageUrl    : General.ImageUrl,
                        affiliateUrl: General.AffiliateUrl,
                        twitter     : General.Twitter,
                        description : General.Description
                    };
                }
            }
        });
        if (svc.cache.has(CACHE_KEY.TOP_VOLUME_TO)) {
            svc.cache.delete(CACHE_KEY.TOP_VOLUME_TO);
        }
        logger.info(`CACHE: Caching ${CACHE_KEY.TOP_VOLUME_TO}`);
        svc.cache.add(CACHE_KEY.TOP_VOLUME_TO, topVolumeTo);
    },
    __generateCoinPromises (topVolumeTo) {
        let coinPromises = [];
        topVolumeTo.Data.forEach(coin => {
            const { ID } = coin;
            if (ID !== -1) {
                coinPromises.push(
                    DataAccessService.get(`${ConfigService.getCoinSnapshotAPIURL()}${ID}`)
                );
            }
        });
        return { promises: coinPromises, topVolumeTo };
    },
    __checkThresholdStatus (blockchainInfo) {
        function __shouldSendAlert (maybeCount) {
            return (!svc.lastAlertSent || moment().subtract(ConfigService.getSendAlertInterval(), 'minutes').isAfter(svc.lastAlertSent)) &&
                maybeCount.isJust() &&
                maybeCount.join() >= ConfigService.getPendingTxThreshold();
        }
        const maybeCount = Maybe.of(blockchainInfo.unconfirmed_count);
        if (__shouldSendAlert(maybeCount)) {
            return new Promise((resolve, reject) => {
                MailerService
                    .sendMessage(
                        EMAIL_SUBJECT,
                        EMAIL_MESSAGE(maybeCount.join())
                    )
                    .then(() => {
                        svc.lastAlertSent = new Date();
                        resolve();
                    })
                    .catch(error => {
                        logger.error(error);
                        reject(error);
                    });
            });
        }
    },
    __cacheExchangesInfo (exchangeInfos) {
        if (!exchangeInfos) return;
        let exchangesPerPair = [];
        exchangeInfos.forEach(exchangeInfo => {
            const exchanges = Maybe.of(exchangeInfo).path('Data.Exchanges');
            if (exchanges.isJust()) {
                exchangesPerPair.push(exchanges.join());
            }
        });
        if (svc.cache.has(CACHE_KEY.EXCHANGE_INFOS)) {
            svc.cache.delete(CACHE_KEY.EXCHANGE_INFOS);
        }
        logger.info(`CACHE: Caching ${CACHE_KEY.EXCHANGE_INFOS}`);
        svc.cache.add(CACHE_KEY.EXCHANGE_INFOS, exchangesPerPair);
        return exchangeInfos;
    },
    __storeCoinInfo (exchangeInfos) {
        if (!exchangeInfos) return;
        let promise = null;
        exchangeInfos.forEach(exchangeInfo => {
            const coinInfo = Maybe.of(exchangeInfo).path('Data.CoinInfo');
            if (coinInfo.isJust() && !promise) {
                logger.info('COININFO: Storing coininfo');
                promise = MongooseService.saveNewObject(coinInfoModel, coinInfo.join());
            }
        });
        return promise;
    },
    __storePriceInfo (price) {
        if (Maybe.of(price.RAW.ETH.BTC).isJust() &&
            Maybe.of(price.RAW.ETH.USD).isJust()) {
            return MongooseService.saveNewObject(priceModel, {
                RAW: {
                    ETH: {
                        USD: {
                            PRICE : Maybe.of(price.RAW.ETH.USD.PRICE).join(),
                            MKTCAP: Maybe.of(price.RAW.ETH.USD.MKTCAP).join()
                        },
                        BTC: {
                            PRICE: Maybe.of(price.RAW.ETH.BTC.PRICE).join()
                        }
                    }
                }
            });
        }
    }
};

export default EthereumAPIService;
