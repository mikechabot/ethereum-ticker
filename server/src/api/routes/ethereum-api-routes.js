const PATH = {
    ETH_PRICE_CURRENT        : '/api/eth/price',
    ETH_PRICE_HISTORICAL     : '/api/eth/price/history',
    ETH_BLOCKCHAIN_CURRENT   : '/api/eth/blockchain',
    ETH_BLOCKCHAIN_HISTORICAL: '/api/eth/blockchain/history'
};

export default {
    configure (app, controller) {
        app.get(PATH.ETH_PRICE_CURRENT, controller.handleGetCurrentPriceInfo);
        app.get(PATH.ETH_PRICE_HISTORICAL, controller.handleGetHistoricalPriceInfo);
        app.get(PATH.ETH_BLOCKCHAIN_CURRENT, controller.handleGetCurrentBlockchainInfo);
        app.get(PATH.ETH_BLOCKCHAIN_HISTORICAL, controller.handleGetHistoricalBlockchainInfo);
    }
};
