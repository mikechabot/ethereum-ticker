import axios from 'axios';

/**
 * Service for making AJAX requests.
 * Uses Axios (https://github.com/mzabriskie/axios)
 */
const instance = axios.create({timeout: 4000});

export default {
    request (options) {
        return instance.request(options);
    }
};
