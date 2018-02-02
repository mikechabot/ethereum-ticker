'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ajaxService = require('./ajax-service');

var _ajaxService2 = _interopRequireDefault(_ajaxService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * HTTP service capable of performing GET and POST requests
 * This service will be injected into domain services (e.g. PatientService, MedicationService)
 * Agnostic of prototype/production
 */
var _request = function _request(method, url, data, options) {
    var defaultOptions = {
        method: method,
        url: url,
        responseType: 'json'
    };

    if (data) {
        defaultOptions.data = JSON.stringify(data);
        defaultOptions.headers = {
            'Content-Type': 'application/json'
        };
    }

    var requestOptions = defaultOptions;
    if (options) {
        requestOptions = Object.assign(defaultOptions, options);
    }

    // Resolve the original request, and wrap the response in another promise.
    // This allows allows us to peer into the response before giving it back
    // to the caller, which is helpful when handling situations where a response
    // is technically successful from an AJAX perspective (200 OK), but failed
    // server-side due an arbitrary error (i.e. validation error).
    return new Promise(function (resolve, reject) {
        _ajaxService2.default.request(requestOptions).then(function (response) {
            resolve(response.data);
        }).catch(function (error) {
            if (!error) {
                error = new Error('An unknown error occurred');
            } else if (!error.message) {
                error.message = error.status + ' ' + error.statusText;
            }
            reject(error);
        });
    });
};

var DataAccessService = {
    get: function get(url, options) {
        return _request('GET', url, null, options);
    },
    post: function post(url, data, options) {
        return _request('POST', url, data, options);
    }
};

exports.default = DataAccessService;