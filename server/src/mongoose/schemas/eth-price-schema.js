import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    RAW: Object
});

const EthPriceSchema = mongoose.model('EthPrice', schema);

export default EthPriceSchema;
