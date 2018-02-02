import DataAccessService from '../../services/data-access-service';
import MongooseService from '../../services/mongoose-service';
import ConfigService from '../../services/config-service';
import logger from '../../logger/logger';

const blockchainModel = MongooseService.MODELS.ETH_BLOCKCHAIN;
const priceModel = MongooseService.MODELS.ETH_PRICE;

/**
 * https://www.blockcypher.com/dev/bitcoin/#rate-limits-and-tokens
 * @type {number}
 */
const MAX_REQUESTS_PER_HOUR = ConfigService.getMaxRequestsPerHour();
const API_TOKEN = ConfigService.getAPIToken();

let pollingInterval;

let svc = {};
const EthereumAPIService = svc = {
    getBlockchainInfo () {
        return DataAccessService.get(`https://api.blockcypher.com/v1/eth/main?token=${API_TOKEN}`);
    },
    getEthereumPriceInfo () {
        return DataAccessService.get('https://api.coinmarketcap.com/v1/ticker/ethereum/');
    },
    saveBlockChainInfo () {
        return new Promise((resolve, reject) => {
            Promise.all([
                svc.getBlockchainInfo(),
                svc.getEthereumPriceInfo()
            ])
                .then(values => {
                    Promise.all([
                        MongooseService.saveNewObject(blockchainModel, values[0]),
                        MongooseService.saveNewObject(priceModel, values[1][0])
                    ])
                        .then(results => {
                            logger.info('Polled blockchain', JSON.stringify(results));
                            resolve(results);
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
            logger.info('Starting ETH blockchain polling...');
            logger.info(`Maximum requests per hours: ${MAX_REQUESTS_PER_HOUR}`);
            pollingInterval = setInterval(svc.saveBlockChainInfo, (60 * 60 / MAX_REQUESTS_PER_HOUR) * 1000);
        }
    },
    stopPolling () {
        if (pollingInterval) {
            logger.info('Stopping ETH blockchain polling...');
            window.clearInterval(pollingInterval);
            pollingInterval = undefined;
        }
    }
};

export default EthereumAPIService;
