'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Service for making AJAX requests.
 * Uses Axios (https://github.com/mzabriskie/axios)
 */
var instance = _axios2.default.create({ timeout: 4000 });

exports.default = {
    request: function request(options) {
        return instance.request(options);
    }
};