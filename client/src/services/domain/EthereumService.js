import DataAccessService from '../data/data-access-service';

const EthereumService = {
    getBlockchainInfo () {
        return DataAccessService.get('/eth/blockchain');
    },
    getPriceInfo () {
        return DataAccessService.get('/eth/price');
    },
    getHistoricalBlockchainInfo (daysBack, timeBasis) {
        return DataAccessService.get('/eth/blockchain/history', { daysBack, timeBasis });
    },
    getHistoricalPriceInfo (daysBack, timeBasis) {
        return DataAccessService.get('/eth/price/history', { daysBack, timeBasis });
    }
};

export default EthereumService;
