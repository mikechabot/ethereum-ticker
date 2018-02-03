import DataAccessService from '../../services/data-access-service';
import MongooseService from '../../services/mongoose-service';
import ConfigService from '../../services/config-service';
import logger from '../../logger/logger';

const blockchainModel = MongooseService.MODELS.ETH_BLOCKCHAIN;
const priceModel = MongooseService.MODELS.ETH_PRICE;

let pollingInterval;

let svc = {};
const EthereumAPIService = svc = {
    getBlockchainInfo () {
        let url = ConfigService.getBlockcypherURL();
        const token = ConfigService.getBlockcypherToken();
        if (token) {
            url = `${url}&token=${token}`;
        }
        return DataAccessService.get(url);
    },
    getEthereumPriceInfo () {
        return DataAccessService.get(ConfigService.getCoinMarketCapURL());
    },
    saveBlockChainInfo () {
        return new Promise((resolve, reject) => {
            Promise.all([
                svc.getBlockchainInfo(),
                svc.getEthereumPriceInfo()
            ])
                .then(values => {
                    const blockchain = values[0];
                    const price = values[1][0];
                    Promise.all([
                        MongooseService.saveNewObject(blockchainModel, blockchain),
                        MongooseService.saveNewObject(priceModel, price)
                    ])
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
    getLatestBlockchainInfo () {
        return MongooseService.find(blockchainModel, {
            limit: 1,
            sort : {
                [MongooseService.DOMAIN_PROPERTY.ID]: -1
            }
        });
    },
    getLatestPriceInfo () {
        return MongooseService.find(priceModel, {
            limit: 1,
            sort : {
                [MongooseService.DOMAIN_PROPERTY.ID]: -1
            }
        });
    },
    startPolling () {
        if (!pollingInterval) {
            const maxRequestsPerHour = ConfigService.getBlockcypherMaxRequestsPerHour();
            const requestsPerSecond = (60 * 60 / maxRequestsPerHour);

            logger.info('');
            logger.info('***************************************');
            logger.info('Starting ETH blockchain polling');
            logger.info(`Using API @ ${ConfigService.getBlockcypherURL()}`);
            logger.info(`Maximum requests per hour: ${maxRequestsPerHour}`);
            logger.info(`Polling interval: ${requestsPerSecond} seconds`);
            logger.info(`API Token: ${ConfigService.getBlockcypherToken() || 'None'}`);
            logger.info('***************************************');
            logger.info('');

            svc.saveBlockChainInfo()
                .then(() => {
                    pollingInterval = setInterval(svc.saveBlockChainInfo, requestsPerSecond * 1000);
                })
                .catch(error => {
                    logger.error(error);
                });
        }
    },
    stopPolling () {
        if (pollingInterval) {
            logger.info('Stopping ETH blockchain polling...');
            clearInterval(pollingInterval);
            pollingInterval = undefined;
        }
    }
};

export default EthereumAPIService;
