'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var EMPTY_STRING = '';

exports.default = {
    EMPTY_STRING: EMPTY_STRING,
    __hasValue: function __hasValue(val) {
        return val !== undefined && val !== null;
    },
    __clone: function __clone(obj) {
        if (!obj) return;
        return JSON.parse(JSON.stringify(obj));
    }
};