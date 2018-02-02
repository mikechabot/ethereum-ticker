'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _dataAccessService = require('../../services/data-access-service');

var _dataAccessService2 = _interopRequireDefault(_dataAccessService);

var _mongooseService = require('../../services/mongoose-service');

var _mongooseService2 = _interopRequireDefault(_mongooseService);

var _configService = require('../../services/config-service');

var _configService2 = _interopRequireDefault(_configService);

var _logger = require('../../logger/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var blockchainModel = _mongooseService2.default.MODELS.ETH_BLOCKCHAIN;
var priceModel = _mongooseService2.default.MODELS.ETH_PRICE;

/**
 * https://www.blockcypher.com/dev/bitcoin/#rate-limits-and-tokens
 * @type {number}
 */
var MAX_REQUESTS_PER_HOUR = _configService2.default.getMaxRequestsPerHour();
var API_TOKEN = _configService2.default.getAPIToken();

var pollingInterval = void 0;

var svc = {};
var EthereumAPIService = svc = {
    getBlockchainInfo: function getBlockchainInfo() {
        return _dataAccessService2.default.get('https://api.blockcypher.com/v1/eth/main?token=' + API_TOKEN);
    },
    getEthereumPriceInfo: function getEthereumPriceInfo() {
        return _dataAccessService2.default.get('https://api.coinmarketcap.com/v1/ticker/ethereum/');
    },
    saveBlockChainInfo: function saveBlockChainInfo() {
        return new Promise(function (resolve, reject) {
            Promise.all([svc.getBlockchainInfo(), svc.getEthereumPriceInfo()]).then(function (values) {
                Promise.all([_mongooseService2.default.saveNewObject(blockchainModel, values[0]), _mongooseService2.default.saveNewObject(priceModel, values[1][0])]).then(function (results) {
                    _logger2.default.info('Polled blockchain', JSON.stringify(results));
                    resolve(results);
                });
            }).catch(function (error) {
                _logger2.default.error(error);
                reject(error);
            });
        });
    },
    getLatestBlockchainInfo: function getLatestBlockchainInfo() {
        return _mongooseService2.default.find(blockchainModel, {
            limit: 1,
            sort: _defineProperty({}, _mongooseService2.default.DOMAIN_PROPERTY.ID, -1)
        });
    },
    getLatestPriceInfo: function getLatestPriceInfo() {
        return _mongooseService2.default.find(priceModel, {
            limit: 1,
            sort: _defineProperty({}, _mongooseService2.default.DOMAIN_PROPERTY.ID, -1)
        });
    },
    startPolling: function startPolling() {
        if (!pollingInterval) {
            _logger2.default.info('Starting ETH blockchain polling...');
            _logger2.default.info('Maximum requests per hours: ' + MAX_REQUESTS_PER_HOUR);
            pollingInterval = setInterval(svc.saveBlockChainInfo, 60 * 60 / MAX_REQUESTS_PER_HOUR * 1000);
        }
    },
    stopPolling: function stopPolling() {
        if (pollingInterval) {
            _logger2.default.info('Stopping ETH blockchain polling...');
            window.clearInterval(pollingInterval);
            pollingInterval = undefined;
        }
    }
};

exports.default = EthereumAPIService;