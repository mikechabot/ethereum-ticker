const PATH = {
    ETH_PRICE     : '/api/eth/price',
    ETH_BLOCKCHAIN: '/api/eth'
};

export default {
    configure (app, controller) {
        app.get(PATH.ETH_PRICE, controller.handleGetLatestPriceInfo);
        app.get(PATH.ETH_BLOCKCHAIN, controller.handleGetLatestBlockchainInfo);
    }
};
