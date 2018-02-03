import DataAccessService from '../data/data-access-service';

const EthereumService = {
    getBlockchainInfo () {
        return DataAccessService.get('/eth/blockchain');
    },
    getPriceInfo () {
        return DataAccessService.get('/eth/price');
    }
};

export default EthereumService;
