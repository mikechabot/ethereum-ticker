const { STATUS } = require('../common/app-const');

function _getBaseStatus (status) {
    return {
        lastCheck: new Date(),
        status
    };
}

module.exports = {
    getPingStatus (isAlive, error) {
        return isAlive
            ? this.getUpStatus()
            : this.getDownStatus(error);
    },
    getUpStatus () {
        return _getBaseStatus(STATUS.GREEN);
    },
    getDownStatus (error) {
        return Object.assign(_getBaseStatus(STATUS.RED), { error });
    }
};

