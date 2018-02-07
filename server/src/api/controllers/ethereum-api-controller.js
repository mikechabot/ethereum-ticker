import EthereumAPIService from '../services/ethereum-api-service';
import {ALLOWED_HOURS_BACK, ALLOWED_TIME_BASIS} from '../../common/app-const';

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
        if (!query || !query.hoursBack || !query.timeBasis) {
            return next(new Error('Missing required params'));
        }
        const { hoursBack, timeBasis } = query;

        if (!ALLOWED_HOURS_BACK.includes(hoursBack)) {
            return next(new Error('Invalid hoursBack query'));
        }
        if (!ALLOWED_TIME_BASIS.includes(timeBasis)) {
            return next(new Error('Invalid time basis query'));
        }

        EthereumAPIService
            .getHistoricalBlockchainInfo(hoursBack, timeBasis)
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetHistoricalPriceInfo (request, response, next) {
        const { query } = request;
        if (!query || !query.hoursBack || !query.timeBasis) {
            return next(new Error('Missing required params'));
        }
        const { hoursBack, timeBasis } = query;

        if (!ALLOWED_HOURS_BACK.includes(hoursBack)) {
            return next(new Error('Invalid hoursBack query'));
        }
        if (!ALLOWED_TIME_BASIS.includes(timeBasis)) {
            return next(new Error('Invalid time basis query'));
        }

        EthereumAPIService
            .getHistoricalPriceInfoLastNDays(hoursBack, timeBasis)
            .then(data => response.json(data))
            .catch(error => next(error));
    }
};

export default EthereumAPIController;
