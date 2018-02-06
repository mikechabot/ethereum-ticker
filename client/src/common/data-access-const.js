/**
 * Map of supported HTTP methods
 * @type {{GET: string, POST: string, DELETE: string}}
 */
const HTTP_METHOD = {
    GET   : 'GET',
    POST  : 'POST',
    DELETE: 'DELETE'
};

/**
 * Map of XMLHttpRequest headers (name and value)
 * @type {{NAME: {CONTENT_TYPE: string}, VALUE: {JSON: string}}}
 */
const REQUEST_HEADERS = {
    NAME: {
        CONTENT_TYPE: 'Content-Type'
    },
    VALUE: {
        JSON: 'application/json'
    }
};

/**
 * Map of supported response types
 * @type {{JSON: string, ARRAY_BUFFER: string}}
 */
const RESPONSE_TYPE = {
    JSON        : 'json',
    ARRAY_BUFFER: 'arraybuffer'
};

/**
 * Map of supported MIME types
 * http://www.iana.org/assignments/media-types/media-types.xhtml
 * @type {{XLSX: string}}
 */
const MIME_TYPE = {
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ZIP : 'application/octet-stream'
};

export {
    HTTP_METHOD,
    REQUEST_HEADERS,
    RESPONSE_TYPE,
    MIME_TYPE
};
