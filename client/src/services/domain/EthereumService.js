import DataAccessService from '../data/data-access-service';

const EthereumService = {
    getBlockchainInfo () {
        return DataAccessService.get('/eth/blockchain');
    },
    getPriceInfo () {
        return DataAccessService.get('/eth/price');
    },
    getHistoricalBlockchainInfo (daysBack) {
        return DataAccessService.get(`/eth/blockchain/${daysBack}`);
    },
    getHistoricalPriceInfo (daysBack) {
        return DataAccessService.get(`/eth/price/${daysBack}`);
    }
};

export default EthereumService;
