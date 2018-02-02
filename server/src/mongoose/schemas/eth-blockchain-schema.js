'use strict';

import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    name             : String,
    height           : Number,
    hash             : String,
    time             : Date,
    latest_url       : String,
    previous_hash    : String,
    previous_url     : String,
    peer_count       : Number,
    unconfirmed_count: Number,
    high_gas_price   : Number,
    medium_gas_price : Number,
    low_gas_price    : Number,
    last_fork_height : Number,
    last_fork_hash   : String
});

const EthBlockchainSchema = mongoose.model('EthBlockchain', schema);

export default EthBlockchainSchema;
