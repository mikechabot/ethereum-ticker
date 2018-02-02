import EthereumAPIService from '../services/ethereum-api-service';

const EthereumAPIController = {
    handleGetBlockchainInfo (request, response, next) {
        EthereumAPIService
            .getBlockchainInfo()
            .then(data => response.json(data))
            .catch(error => next(error));
    }
};

export default EthereumAPIController;
