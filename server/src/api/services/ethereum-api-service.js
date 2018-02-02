import DataAccessService from '../../services/data-access-service';
import MongooseService from '../../services/mongoose-service';
import ConfigService from '../../services/config-service';
import logger from '../../logger/logger';

const model = MongooseService.MODELS.ETH_BLOCKCHAIN;

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
    saveBlockChainInfo () {
        return new Promise((resolve, reject) => {
            svc
                .getBlockchainInfo()
                .then(data => MongooseService.saveNewObject(model, data))
                .then(result => {
                    logger.info('Polled blockchain', JSON.stringify(result));
                })
                .catch(error => {
                    logger.error(error);
                    reject(error);
                });
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
