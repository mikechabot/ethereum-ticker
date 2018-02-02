'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _common = require('../common/common');

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DomainObjectService = {
    getPropertyValue: function getPropertyValue(obj, propName) {
        var prop = void 0;
        if (_common2.default.__hasValue(obj) && _common2.default.__hasValue(propName)) {
            prop = obj;
            var propNames = propName.split('.');
            for (var i = 0; i < propNames.length; i++) {
                prop = prop[propNames[i]];
                if (!_common2.default.__hasValue(prop)) break;
            }
        }
        return prop;
    }
};

exports.default = DomainObjectService;