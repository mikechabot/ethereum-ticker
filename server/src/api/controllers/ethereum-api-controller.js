import EthereumAPIService from '../services/ethereum-api-service';

const ALLOWED_DAYS_BACK = ['1', '3', '7', '14', '30', '60', '90', '120', '365'];

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
        const { params } = request;
        if (!params || !params.daysBack) {
            return next(new Error('Missing required params'));
        }

        const { daysBack } = params;

        if (!ALLOWED_DAYS_BACK.includes(daysBack)) {
            return next(new Error('Invalid daysBack param'));
        }
        EthereumAPIService
            .getHistoricalBlockchainInfo(daysBack)
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetHistoricalPriceInfo (request, response, next) {
        const { params } = request;
        if (!params || !params.daysBack) {
            return next(new Error('Missing required params'));
        }

        const { daysBack } = params;

        if (!ALLOWED_DAYS_BACK.includes(daysBack)) {
            return next(new Error('Invalid daysBack param'));
        }
        EthereumAPIService
            .getHistoricalPriceInfoLastNDays(daysBack)
            .then(data => response.json(data))
            .catch(error => next(error));
    }
};

export default EthereumAPIController;
