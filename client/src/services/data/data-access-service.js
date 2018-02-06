import AjaxService from './ajax-service';
import {HTTP_METHOD, REQUEST_HEADERS, RESPONSE_TYPE} from '../../common/data-access-const';

/**
 * HTTP service capable of performing GET and POST requests
 * This service will be injected into domain services (e.g. PatientService, MedicationService)
 * Agnostic of prototype/production
 */
const _request = (method, url, data, responseType) => {
    let options = _buildRequestOptions(method, url, responseType);

    if (data && method === HTTP_METHOD.GET) {
        options.params = data;
    } else if (data) {
        options.data = JSON.stringify(data);
        options.headers = _buildRequestHeaders();
    }

    // Resolve the original request, and wrap the response in another promise.
    // This allows allows us to peer into the response before giving it back
    // to the caller, which is helpful when handling situations where a response
    // is technically successful from an AJAX perspective (200 OK), but failed
    // server-side due an arbitrary error (i.e. validation error).
    return new Promise((resolve, reject) => {
        AjaxService.request(options)
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                if (!error) {
                    error = new Error('An unknown error occurred');
                } else if (!error.message) {
                    error.message = `${error.status} ${error.statusText}`;
                }
                reject(error);
            });
    });
};

/**
 * Build generic request options
 * @param method
 * @param url
 * @return {{method: *, url: *, responseType: *}}
 * @private
 */
function _buildRequestOptions (method, url, responseType) {
    return {
        method      : method,
        url         : url,
        responseType: responseType || RESPONSE_TYPE.JSON
    };
}

/**
 * Build generic request headers
 * @return {{}}
 * @private
 */
function _buildRequestHeaders () {
    return {
        [REQUEST_HEADERS.NAME.CONTENT_TYPE]: REQUEST_HEADERS.VALUE.JSON
    };
}

const DataAccessService = {
    get (url, data, responseType) {
        return _request('GET', url, data, responseType);
    },
    post (url, data, responseType) {
        return _request('POST', url, data, responseType);
    }
};

export default DataAccessService;
