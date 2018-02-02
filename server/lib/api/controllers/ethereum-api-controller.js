'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ethereumApiService = require('../services/ethereum-api-service');

var _ethereumApiService2 = _interopRequireDefault(_ethereumApiService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EthereumAPIController = {
    handleGetLatestBlockchainInfo: function handleGetLatestBlockchainInfo(request, response, next) {
        _ethereumApiService2.default.getLatestBlockchainInfo().then(function (data) {
            return response.json(data[0]);
        }).catch(function (error) {
            return next(error);
        });
    },
    handleGetLatestPriceInfo: function handleGetLatestPriceInfo(request, response, next) {
        _ethereumApiService2.default.getLatestPriceInfo().then(function (data) {
            return response.json(data[0]);
        }).catch(function (error) {
            return next(error);
        });
    }
};

exports.default = EthereumAPIController;