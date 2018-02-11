import moment from 'moment';
import Maybe from 'maybe-baby';
import _groupBy from 'lodash/groupBy';
import _minBy from 'lodash/minBy';
import _maxBy from 'lodash/maxBy';

import DataAccessService from '../../services/data-access-service';
import MongooseService from '../../services/mongoose-service';
import ConfigService from '../../services/config-service';
import logger from '../../logger/logger';
import MailerService from '../../services/mailer-service';
import CacheService from '../../services/cache-service';

const { DOMAIN_PROPERTY, QUERY_PROPERTY } = MongooseService;

const blockchainModel = MongooseService.MODELS.ETH_BLOCKCHAIN;
const priceModel = MongooseService.MODELS.ETH_PRICE;
const coinInfoModel = MongooseService.MODELS.COIN_INFO;

let currentEthUsdDelta = -1;
let lastAlertSent;

const MOMENT_HOUR = 'hour';
const MOMENT_MINUTE = 'minute';

const DEFAULT = {
    HOURS_BACK: 1,
    TIME_BASIS: MOMENT_HOUR
};

const CACHE_KEY = {
    EXCHANGE_INFOS: 'exchangesInfos',
    TOP_VOLUME_TO : 'topVolumeTo',
    PRICE         : 'price',
    BLOCKCHAIN    : 'blockchain'
};

const PENDING_TRANSACTION_LABEL = 'Pending transaction count';
const CACHE_NOT_READY = 'CACHE: Cache not ready';

function __generateParameters (hoursBack) {
    const params = {};
    if (hoursBack) {
        params[DOMAIN_PROPERTY.CREATED_DATE] = {
            [QUERY_PROPERTY.GREATER_THAN_OR_EQUAL]: new Date(moment().subtract(hoursBack, MOMENT_HOUR).startOf(MOMENT_HOUR).toString())
        };
    }
    return params;
}

let svc = {};
const EthereumAPIService = svc = {
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
        return Promise.resolve(CacheService.find(CACHE_KEY.EXCHANGE_INFOS));
    },
    getCurrentTopVolumeToFromCache () {
        return Promise.resolve(CacheService.find(CACHE_KEY.TOP_VOLUME_TO));
    },
    getHistoricalPriceInfoFromCache (hoursBack = DEFAULT.HOURS_BACK, timeBasis = DEFAULT.TIME_BASIS) {
        return svc.getTimestampedDataFromCache(`${CACHE_KEY.PRICE}-${hoursBack}-${timeBasis}`);
    },
    getHistoricalBlockchainInfoFromCache (hoursBack = DEFAULT.HOURS_BACK, timeBasis = DEFAULT.TIME_BASIS) {
        return svc.getTimestampedDataFromCache(`${CACHE_KEY.BLOCKCHAIN}-${hoursBack}-${timeBasis}`);
    },
    getTimestampedDataFromCache (cacheKey) {
        if (CacheService.has(cacheKey)) {
            const value = CacheService.find(cacheKey);
            return Promise.resolve(value.data);
        } else {
            return Promise.reject(new Error(CACHE_NOT_READY));
        }
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
                        .then(coinInfo => svc.__attachCoinInfosToVolume(coinInfo, topVolumeTo))
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
                .then(svc.__generateBlockchainResponse)
                .then(resolve)
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

    generateHistoricalBlockchainStats (hoursBack = DEFAULT.HOURS_BACK, timeBasis = DEFAULT.TIME_BASIS, timeoutOptions) {
        const cacheKey = `${CACHE_KEY.BLOCKCHAIN}-${hoursBack}-${timeBasis}`;

        const __generate = () => {
            return new Promise((resolve, reject) => {
                CacheService.deleteIfPresent(cacheKey);
                MongooseService
                    .find(blockchainModel, {
                        params: __generateParameters(hoursBack),
                        sort  : {
                            [MongooseService.DOMAIN_PROPERTY.ID]: 1
                        }
                    })
                    .then(blockchainInfos => svc.__normalizeBlockchainInfosByTimeBase(blockchainInfos, timeBasis))
                    .then(normalizedBlockchainInfos => svc.__generateLineDataFromBlockchainInfos(normalizedBlockchainInfos, timeBasis))
                    .then(historicalBlockchainInfo => {
                        CacheService.add(cacheKey, {
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
    generateHistoricalPriceStats (hoursBack = DEFAULT.HOURS_BACK, timeBasis = DEFAULT.TIME_BASIS, timeoutOptions) {
        const cacheKey = `${CACHE_KEY.PRICE}-${hoursBack}-${timeBasis}`;
        const __generate = () => {
            return new Promise((resolve, reject) => {
                CacheService.deleteIfPresent(cacheKey);
                MongooseService
                    .find(priceModel, {
                        params: __generateParameters(hoursBack),
                        sort  : {
                            [MongooseService.DOMAIN_PROPERTY.ID]: 1
                        }
                    })
                    .then(prices => svc.__normalizePricesByTimeBasis(prices, timeBasis))
                    .then(normalizedPrices => svc.__generateCandlestickDataFromNormalizedPrices(normalizedPrices))
                    .then(historicalPrices => {
                        CacheService.add(cacheKey, {
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
    __normalizeBlockchainInfosByTimeBase (blockInfos, timeBasis = DEFAULT.TIME_BASIS) {
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
    __normalizePricesByTimeBasis (prices, timeBasis = DEFAULT.TIME_BASIS) {
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
    __generateLineDataFromBlockchainInfos (normalizedBlockchainInfos) {
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
    __generateCandlestickDataFromNormalizedPrices (normalizedPrices) {
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
    __generateBlockchainResponse (blockchainInfos) {
        const current = blockchainInfos[0];
        const previous = blockchainInfos[1];
        current.pendingTxDelta = current.unconfirmed_count - previous.unconfirmed_count;
        return current;
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
    __attachCoinInfosToVolume (coinInfo, topVolumeTo) {
        topVolumeTo.Data.forEach(svc.__attachCoinInfoToVolume.bind(this, coinInfo, topVolumeTo));
        CacheService.deleteAndAdd(CACHE_KEY.TOP_VOLUME_TO, topVolumeTo);
    },
    __attachCoinInfoToVolume (coinInfo, topVolumeTo, coin) {
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
            return (!svc.lastAlertSent || moment().subtract(ConfigService.getSendAlertInterval(), MOMENT_MINUTE).isAfter(svc.lastAlertSent)) &&
                maybeCount.isJust() &&
                maybeCount.join() >= ConfigService.getPendingTxThreshold();
        }
        const maybeCount = Maybe.of(blockchainInfo.unconfirmed_count);
        if (__shouldSendAlert(maybeCount)) {
            return new Promise((resolve, reject) => {
                MailerService
                    .generateThresholdMessage(
                        PENDING_TRANSACTION_LABEL,
                        ConfigService.getPendingTxThreshold(),
                        maybeCount.join()
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
        const __getExchanges = (exchangeInfo) => {
            const exchanges = Maybe.of(exchangeInfo).path('Data.Exchanges');
            if (exchanges.isJust()) {
                exchangesPerPair.push(exchanges.join());
            }
        };

        exchangeInfos.forEach(__getExchanges);
        CacheService.deleteAndAdd(CACHE_KEY.EXCHANGE_INFOS, exchangesPerPair);

        return exchangeInfos;
    },
    __storeCoinInfo (exchangeInfos) {
        if (!exchangeInfos) return;

        let promise = null;
        const _store = (exchangeInfo) => {
            const coinInfo = Maybe.of(exchangeInfo).path('Data.CoinInfo');
            if (coinInfo.isJust() && !promise) {
                promise = MongooseService.saveNewObject(coinInfoModel, coinInfo.join());
            }
        };

        exchangeInfos.forEach(_store);

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
