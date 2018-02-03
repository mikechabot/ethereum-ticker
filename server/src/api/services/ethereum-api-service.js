import DataAccessService from '../../services/data-access-service';
import MongooseService from '../../services/mongoose-service';
import ConfigService from '../../services/config-service';
import logger from '../../logger/logger';

const blockchainModel = MongooseService.MODELS.ETH_BLOCKCHAIN;
const priceModel = MongooseService.MODELS.ETH_PRICE;

let blockchainInterval;
let priceInterval;

const intervals = [ blockchainInterval, priceInterval];

let currentEthUsdDelta = -1;

let svc = {};
const EthereumAPIService = svc = {
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
                .then(resolve)
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getAndSavePriceInfo () {
        return new Promise((resolve, reject) => {
            svc.getPriceInfoFromAPI()
                .then(price => MongooseService.saveNewObject(priceModel, price))
                .then(resolve)
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
        });
    },
    getLatestBlockchainInfo () {
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
    getLatestPriceInfo () {
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
                        BTC      : BTC.PRICE,
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
    startPolling () {
        svc.startPollingWithConfigs([
            {
                key           : 'blockchain',
                interval      : blockchainInterval,
                url           : ConfigService.getBlockchainAPIUrl(),
                token         : ConfigService.getBlockchainAPIToken(),
                requestsPerDay: ConfigService.getBlockchainAPIMaxRequestsPerDay(),
                promise       : svc.getAndSaveBlockchainInfo
            },
            {
                key           : 'price',
                interval      : priceInterval,
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
        }
    },
    startPollingWithConfig (config, index = 0) {
        if (!config.interval) {
            const requestsPerSec = (60 * 60 * 24) / config.requestsPerDay;
            logger.info('');
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
        intervals.forEach((interval, index) => {
            if (interval) {
                logger.info(`Stopping ETH polling interval #${index + 1}`);
                clearInterval(blockchainInterval);
                blockchainInterval = undefined;
            }
        });
    }
};

export default EthereumAPIService;
