'use strict';

var _require = require('../common/app-const'),
    STATUS = _require.STATUS;

function _getBaseStatus(status) {
    return {
        lastCheck: new Date(),
        status: status
    };
}

module.exports = {
    getPingStatus: function getPingStatus(isAlive, error) {
        return isAlive ? this.getUpStatus() : this.getDownStatus(error);
    },
    getUpStatus: function getUpStatus() {
        return _getBaseStatus(STATUS.GREEN);
    },
    getDownStatus: function getDownStatus(error) {
        return Object.assign(_getBaseStatus(STATUS.RED), { error: error });
    }
};