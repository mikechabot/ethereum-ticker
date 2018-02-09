import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    Name              : String,
    FullName          : String,
    Internal          : String,
    ImageUrl          : String,
    Url               : String,
    Algorithm         : String,
    ProofType         : String,
    TotalCoinsMined   : Number,
    BlockNumber       : Number,
    NetHashesPerSecond: Number,
    BlockReward       : Number,
    TotalVolume24H    : Number
});

const CoinInfo = mongoose.model('CoinInfo', schema);

export default CoinInfo;
