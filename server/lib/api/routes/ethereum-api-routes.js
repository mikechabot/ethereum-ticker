'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var PATH = {
    ETHEREUM: '/api/eth'
};

exports.default = {
    configure: function configure(app, controller) {
        app.get(PATH.ETHEREUM, controller.handleGetBlockchainInfo);
    }
};