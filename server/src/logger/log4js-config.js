module.exports = {
    appenders: {
        file: { type: 'file', filename: 'ethereum-api-node.log' },
        out : { type: 'console' }
    },
    categories: {
        default: {
            appenders: ['file', 'out'], level    : 'info'
        }
    }
};
