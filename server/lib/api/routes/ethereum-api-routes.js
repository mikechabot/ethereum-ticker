'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var PATH = {
    ETH_PRICE: '/api/eth/price',
    ETH_BLOCKCHAIN: '/api/eth'
};

exports.default = {
    configure: function configure(app, controller) {
        app.get(PATH.ETH_PRICE, controller.handleGetLatestPriceInfo);
        app.get(PATH.ETH_BLOCKCHAIN, controller.handleGetLatestBlockchainInfo);
    }
};