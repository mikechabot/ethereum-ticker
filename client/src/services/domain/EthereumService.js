import DataAccessService from '../data/data-access-service';

const EthereumService = {
    getBlockchainInfo () {
        return DataAccessService.get('/eth/blockchain');
    },
    getPriceInfo () {
        return DataAccessService.get('/eth/price');
    },
    getHistoricalBlockchainInfo (hoursBack, timeBasis) {
        return DataAccessService.get('/eth/blockchain/history', { hoursBack, timeBasis });
    },
    getHistoricalPriceInfo (hoursBack, timeBasis) {
        return DataAccessService.get('/eth/price/history', { hoursBack, timeBasis });
    }
};

export default EthereumService;
