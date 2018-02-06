import EthereumAPIService from '../services/ethereum-api-service';

const ALLOWED_DAYS_BACK = ['1', '3', '7'];
const ALLOWED_TIME_BASIS = ['minute', 'hour'];

const EthereumAPIController = {
    handleGetCurrentBlockchainInfo (request, response, next) {
        EthereumAPIService
            .getCurrentBlockchainInfo()
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetCurrentPriceInfo (request, response, next) {
        EthereumAPIService
            .getCurrentPriceInfo()
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetHistoricalBlockchainInfo (request, response, next) {
        const { query } = request;
        if (!query || !query.daysBack || !query.timeBasis) {
            return next(new Error('Missing required params'));
        }
        const { daysBack, timeBasis } = query;

        if (!ALLOWED_DAYS_BACK.includes(daysBack)) {
            return next(new Error('Invalid daysBack query'));
        }
        if (!ALLOWED_TIME_BASIS.includes(timeBasis)) {
            return next(new Error('Invalid time basis query'));
        }

        EthereumAPIService
            .getHistoricalBlockchainInfo(daysBack, timeBasis)
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetHistoricalPriceInfo (request, response, next) {
        const { query } = request;
        if (!query || !query.daysBack || !query.timeBasis) {
            return next(new Error('Missing required params'));
        }
        const { daysBack, timeBasis } = query;

        if (!ALLOWED_DAYS_BACK.includes(daysBack)) {
            return next(new Error('Invalid daysBack query'));
        }
        if (!ALLOWED_TIME_BASIS.includes(timeBasis)) {
            return next(new Error('Invalid time basis query'));
        }

        EthereumAPIService
            .getHistoricalPriceInfoLastNDays(daysBack, timeBasis)
            .then(data => response.json(data))
            .catch(error => next(error));
    }
};

export default EthereumAPIController;
