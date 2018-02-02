import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    name              : String,
    symbol            : String,
    rank              : Number,
    price_usd         : Number,
    price_btc         : Number,
    volume            : Number,
    market_cap_usd    : Number,
    available_supply  : Number,
    total_supply      : Number,
    max_supply        : Number,
    percent_change_1h : Number,
    percent_change_24h: Number,
    percent_change_7d : Number
});

const EthPriceSchema = mongoose.model('EthPrice', schema);

export default EthPriceSchema;
