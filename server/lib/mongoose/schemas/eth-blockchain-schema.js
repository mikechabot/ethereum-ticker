'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var schema = new _mongoose2.default.Schema({
    name: String,
    height: Number,
    hash: String,
    time: Date,
    latest_url: String,
    previous_hash: String,
    previous_url: String,
    peer_count: Number,
    unconfirmed_count: Number,
    high_gas_price: Number,
    medium_gas_price: Number,
    low_gas_price: Number,
    last_fork_height: Number,
    last_fork_hash: String
});

var EthBlockchainSchema = _mongoose2.default.model('EthBlockchain', schema);

exports.default = EthBlockchainSchema;