'use strict';

module.exports = {
    appenders: {
        file: { type: 'file', filename: 'quickrant-node.log' },
        out: { type: 'console' }
    },
    categories: {
        default: {
            appenders: ['file', 'out'], level: 'info'
        }
    }
};