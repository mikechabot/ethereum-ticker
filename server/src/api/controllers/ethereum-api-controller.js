import EthereumAPIService from '../services/ethereum-api-service';

const EthereumAPIController = {
    handleGetLatestBlockchainInfo (request, response, next) {
        EthereumAPIService
            .getLatestBlockchainInfo()
            .then(data => response.json(data[0]))
            .catch(error => next(error));
    },
    handleGetLatestPriceInfo (request, response, next) {
        EthereumAPIService
            .getLatestPriceInfo()
            .then(data => response.json(data[0]))
            .catch(error => next(error));
    }
};

export default EthereumAPIController;
