import mongoose from 'mongoose';

export default {
    ETH_BLOCKCHAIN: mongoose.model('EthBlockchain'),
    ETH_PRICE     : mongoose.model('EthPrice')
};
