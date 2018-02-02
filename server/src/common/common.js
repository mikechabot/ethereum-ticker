const EMPTY_STRING = '';

export default {
    EMPTY_STRING: EMPTY_STRING,
    __hasValue (val) {
        return val !== undefined && val !== null;
    },
    __clone (obj) {
        if (!obj) return;
        return JSON.parse(JSON.stringify(obj));
    }
};
