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

var model = _mongooseService2.default.MODELS.ETH_BLOCKCHAIN;

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
    saveBlockChainInfo: function saveBlockChainInfo() {
        return new Promise(function (resolve, reject) {
            svc.getBlockchainInfo().then(function (data) {
                return _mongooseService2.default.saveNewObject(model, data);
            }).then(function (result) {
                _logger2.default.info('Polled blockchain', JSON.stringify(result));
            }).catch(function (error) {
                _logger2.default.error(error);
                reject(error);
            });
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