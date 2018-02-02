'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _logger = require('../logger/logger');

var _logger2 = _interopRequireDefault(_logger);

var _models = require('../mongoose/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _isFunction = require('lodash/isFunction');

/**
 * Domain objects stored in MongoDB will contain at least the following properties
 * @type {{ID: string, CREATED_AT: string, UPDATED_AT: string, DELETED: string}}
 */
var DOMAIN_PROPERTY = {
    ID: '_id',
    CREATED_DATE: 'createdDate',
    UPDATED_DATE: 'updatedDate',
    DELETED: 'deleted'
};

var PARAMS = {
    NON_DELETED: _defineProperty({}, DOMAIN_PROPERTY.DELETED, {
        $ne: true
    })
};

function __getModelInstance(Model, object, isNew) {
    var instance = new Model(object);
    instance.isNew = isNew;
    return instance;
}

exports.default = {
    MODELS: _models2.default,
    PARAMS: PARAMS,
    DOMAIN_PROPERTY: DOMAIN_PROPERTY,
    execute: function execute(query, options) {
        var populate = options.populate,
            limit = options.limit,
            sort = options.sort,
            skip = options.skip;


        if (sort) query = query.sort(sort);
        if (skip) query = query.skip(skip);
        if (limit) query = query.limit(limit);
        if (populate) query = query.populate(populate);

        return this.__lean(query, options.postprocessor);
    },
    aggregate: function aggregate(Model, options) {
        return Model.aggregate(options);
    },

    /**
     * Locate a single object within a given model collection.
     * @param Model
     * @param params
     * @param populate
     * @param postprocessor
     * @returns {*}
     */
    findOne: function findOne(Model) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return this.execute(Model.findOne(options.params || PARAMS.NON_DELETED), options);
    },


    /**
     * Locate a list of objects within a given model collection.
     * @param Model
     * @param options
     * @returns {*|Promise}
     */
    find: function find(Model) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return this.execute(Model.find(options.params || PARAMS.NON_DELETED), options);
    },
    findAll: function findAll(Model) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return this.find(Model, Object.assign(options, { params: PARAMS.NON_DELETED }));
    },

    /**
     * Locate an object by id within a given model collection.
     * @param Model
     * @param id
     * @param options
     * @returns {*}
     */
    findById: function findById(Model, id) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        return this.findOne(Model, Object.assign(options, { params: _defineProperty({}, DOMAIN_PROPERTY.ID, id) }));
    },

    /**
     * Insert a new document into a Mongo collection. Audit the action
     * @param Model
     * @param object
     * @param objectType
     * @returns {Promise}
     */
    saveNewObject: function saveNewObject(Model, object) {
        return new Promise(function (resolve, reject) {
            __getModelInstance(Model, object, true).save().then(function (newObject) {
                return resolve(newObject);
            }).catch(function (error) {
                _logger2.default.error('Error saving new object: ' + JSON.stringify(object));
                _logger2.default.error(error);
                reject(error);
            });
        });
    },

    /**
     * Update an existing document in a Mongo collection. Audit the action.
     * @param Model
     * @param object
     * @param objectType
     * @returns {Promise}
     */
    updateObject: function updateObject(Model, object) {
        return new Promise(function (resolve, reject) {
            __getModelInstance(Model, object, false).save().then(function (newObject) {
                return resolve(newObject);
            }).catch(function (error) {
                _logger2.default.error('Error updating object id: ' + JSON.stringify(object));
                _logger2.default.error(error);
                reject(error);
            });
        });
    },
    saveOrUpdateObject: function saveOrUpdateObject(Model, object) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            var saveOrUpdate = object._id ? _this.updateObject : _this.saveNewObject;
            saveOrUpdate(Model, object).then(function (results) {
                return resolve(results);
            }).catch(function (error) {
                return reject(error);
            });
        });
    },

    /**
     * Soft delete an existing mongo document
     * @param Model
     * @param objectId
     * @returns {Promise}
     */
    deleteObject: function deleteObject(Model, objectId) {
        var _this2 = this;

        return new Promise(function (resolve, reject) {
            _this2.findById(Model, objectId).then(function (nonDeletedObject) {
                __getModelInstance(Model, Object.assign({}, nonDeletedObject, _defineProperty({}, DOMAIN_PROPERTY.DELETED, true)), false).save().then(function (deletedObject) {
                    return resolve(deletedObject);
                }).catch(function (error) {
                    _logger2.default.error(error);
                    reject(error);
                });
            }).catch(function (error) {
                _logger2.default.error(error);
                reject(error);
            });
        });
    },

    /**
     * Execute a lean Mongoose query against a given model collection.
     * If a postprocessor function is provided, run the result set through it, then return
     * @param queryFunction
     * @param postprocessor
     * @returns {Promise|Promise.<TResult>}
     * @private
     */
    __lean: function __lean(queryFunction, postprocessor) {
        if (postprocessor && !_isFunction(postprocessor)) {
            throw new Error('postprocessor must be a function');
        } else {
            return queryFunction.lean().exec().then(function (results) {
                return postprocessor ? postprocessor(results) : results;
            }).catch(function (error) {
                _logger2.default.error(error);
                return error;
            });
        }
    }
};