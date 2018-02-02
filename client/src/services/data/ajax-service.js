import ConfigService from '../common/config-service';
import axios from 'axios';

/**
 * Service for making AJAX requests.
 * Uses Axios (https://github.com/mzabriskie/axios)
 */
const instance = axios.create({
    baseURL: ConfigService.getBaseUrl(),
    timeout: 4000
});

export default {
    request (options) {
        return instance.request(options);
    }
};
