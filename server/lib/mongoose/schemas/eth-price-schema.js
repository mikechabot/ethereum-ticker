'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var schema = new _mongoose2.default.Schema({
    name: String,
    symbol: String,
    rank: Number,
    price_usd: Number,
    price_btc: Number,
    volume: Number,
    market_cap_usd: Number,
    available_supply: Number,
    total_supply: Number,
    max_supply: Number,
    percent_change_1h: Number,
    percent_change_24h: Number,
    percent_change_7d: Number
});

var EthPriceSchema = _mongoose2.default.model('EthPrice', schema);

exports.default = EthPriceSchema;