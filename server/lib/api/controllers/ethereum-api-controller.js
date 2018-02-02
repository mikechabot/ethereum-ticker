'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ethereumApiService = require('../services/ethereum-api-service');

var _ethereumApiService2 = _interopRequireDefault(_ethereumApiService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EthereumAPIController = {
    handleGetBlockchainInfo: function handleGetBlockchainInfo(request, response, next) {
        _ethereumApiService2.default.getBlockchainInfo().then(function (data) {
            return response.json(data);
        }).catch(function (error) {
            return next(error);
        });
    }
};

exports.default = EthereumAPIController;