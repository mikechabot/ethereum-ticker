'use strict';

const _isFunction = require('lodash/isFunction');

import logger from '../logger/logger';
import MODELS from '../mongoose/models';

/**
 * Domain objects stored in MongoDB will contain at least the following properties
 * @type {{ID: string, CREATED_AT: string, UPDATED_AT: string, DELETED: string}}
 */
const DOMAIN_PROPERTY = {
    ID          : '_id',
    CREATED_DATE: 'createdDate',
    UPDATED_DATE: 'updatedDate',
    DELETED     : 'deleted'
};

const PARAMS = {
    NON_DELETED: {
        [DOMAIN_PROPERTY.DELETED]: {
            $ne: true
        }
    }
};

function __getModelInstance (Model, object, isNew) {
    const instance = new Model(object);
    instance.isNew = isNew;
    return instance;
}

export default {
    MODELS         : MODELS,
    PARAMS         : PARAMS,
    DOMAIN_PROPERTY: DOMAIN_PROPERTY,
    execute (query, options) {
        const { populate, limit, sort, skip } = options;

        if (sort) query = query.sort(sort);
        if (skip) query = query.skip(skip);
        if (limit) query = query.limit(limit);
        if (populate) query = query.populate(populate);

        return this.__lean(query, options.postprocessor);
    },
    aggregate (Model, options) {
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
    findOne (Model, options = {}) {
        return this.execute(
            Model.findOne(options.params || PARAMS.NON_DELETED),
            options
        );
    },

    /**
     * Locate a list of objects within a given model collection.
     * @param Model
     * @param options
     * @returns {*|Promise}
     */
    find (Model, options = {}) {
        return this.execute(
            Model.find(options.params || PARAMS.NON_DELETED),
            options
        );
    },
    findAll (Model, options = {}) {
        return this.find(Model, Object.assign(options, { params: PARAMS.NON_DELETED }));
    },
    /**
     * Locate an object by id within a given model collection.
     * @param Model
     * @param id
     * @param options
     * @returns {*}
     */
    findById (Model, id, options = {}) {
        return this.findOne(Model, Object.assign(options, { params: { [DOMAIN_PROPERTY.ID]: id } }));
    },
    /**
     * Insert a new document into a Mongo collection. Audit the action
     * @param Model
     * @param object
     * @param objectType
     * @returns {Promise}
     */
    saveNewObject (Model, object) {
        return new Promise((resolve, reject) => {
            __getModelInstance(Model, object, true)
                .save()
                .then(newObject => resolve(newObject))
                .catch(error => {
                    logger.error(`Error saving new object: ${JSON.stringify(object)}`);
                    logger.error(error);
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
    updateObject (Model, object) {
        return new Promise((resolve, reject) => {
            __getModelInstance(Model, object, false)
                .save()
                .then(newObject => resolve(newObject))
                .catch(error => {
                    logger.error(`Error updating object id: ${JSON.stringify(object)}`);
                    logger.error(error);
                    reject(error);
                });
        });
    },
    saveOrUpdateObject (Model, object) {
        return new Promise((resolve, reject) => {
            const saveOrUpdate = object._id ? this.updateObject : this.saveNewObject;
            saveOrUpdate(Model, object)
                .then(results => resolve(results))
                .catch(error => reject(error));
        });
    },
    /**
     * Soft delete an existing mongo document
     * @param Model
     * @param objectId
     * @returns {Promise}
     */
    deleteObject (Model, objectId) {
        return new Promise((resolve, reject) => {
            this.findById(Model, objectId)
                .then(nonDeletedObject => {
                    __getModelInstance(Model, Object.assign({}, nonDeletedObject, { [DOMAIN_PROPERTY.DELETED]: true }), false)
                        .save()
                        .then(deletedObject => resolve(deletedObject))
                        .catch(error => {
                            logger.error(error);
                            reject(error);
                        });
                })
                .catch(error => {
                    logger.error(error);
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
    __lean (queryFunction, postprocessor) {
        if (postprocessor && !_isFunction(postprocessor)) {
            throw new Error('postprocessor must be a function');
        } else {
            return queryFunction
                .lean()
                .exec()
                .then(results => {
                    return postprocessor
                        ? postprocessor(results)
                        : results;
                })
                .catch(error => {
                    logger.error(error);
                    return error;
                });
        }
    }
};
