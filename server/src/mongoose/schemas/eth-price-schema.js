import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    RAW    : Object,
    DISPLAY: Object
});

const EthPriceSchema = mongoose.model('EthPrice', schema);

export default EthPriceSchema;
